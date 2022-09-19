import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Nav from "./Nav";
import DashMenu from "./Dashboard/DashMenu";
import styles from "../styles/components/layout.module.css";
import DashHeader from "./Dashboard/DashHeader";
import Private from "./Private/Private";
import {
	getLocalStorage,
	removeLocalStorage,
	setLocalStorage,
} from "../actions/auth/auth";
import { db } from "../firebase/fireConfig";
import {
	collection,
	query,
	where,
	onSnapshot,
	getDocs,
	getDoc,
	doc,
	updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useRouter } from "next/router";
import Router from "next/router";
import { versionNumber } from "../staticData/versionNumber";
import {
	updatePastSchedules,
	updateYdaySchedPaused,
} from "../actions/dashboard/scheduleCrud";
import playNotificationSound, { isSoundEnabled } from "../helper/PlayAudio";
import EnableSound from "./Misc/EnableSound";

const style = {
	position: "absolute",
	width: "100%",
	height: "100%",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

function Layout({ children, currentPage, subPage, uid, pendingCount }) {
	const [audio, setAudio] = useState(null);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [open, setOpen] = useState(false);

	// const [pendingOrders, setPendingOrders] = useState({
	// 	pendingCount: 0,
	// });

	const [confirmedOrders, setConfirmedOrders] = useState({
		confirmedCount: 0,
	});

	const [notificationsNotice, setNotificationsNotice] = useState({
		numOrdersUnnoticed: 0,
		errorMessage: "",
		orderData: [],
	});

	const [notificationsConfirmed, setNotificationsConfirmed] = useState({
		numOrdersConfirmed: 0,
		ordersConfirmedErrorMessage: "",
		ordersConfirmedData: [],
	});

	const [user, setUser] = useState({
		userData: {},
		bizId: [],
		uid: "",
	});

	// const { pendingCount } = pendingOrders;
	const { confirmedCount } = confirmedOrders;
	const { numOrdersUnnoticed, errorMessage, orderData } = notificationsNotice;
	const { userData, bizId } = user;

	const buttonSoundRef = useRef(null);
	const router = useRouter();
	let wakeLock = null;

	useEffect(() => {
		// const auth = getAuth();
		// const user = auth.currentUser;
		// console.log("user", user);

		requestWakeLock();
		updateVersion();
		document.addEventListener("visibilitychange", onVisibilityChange);
		document.addEventListener("visibilitychange", updateVersion);

		if (audio === null) {
			setAudio(new Audio("/sounds/smsTone.mp3"));
		}

		// * If on public pages or admin, don't run liveOrders
		if (currentPage === "public" || currentPage === "admin") {
			return;
		}
		const storedUser = JSON.parse(getLocalStorage("user"));
		const storedUid = JSON.parse(getLocalStorage("uid"));
		const bizOwned = storedUser.bizOwned;
		const numBizOwned = Object.keys(bizOwned).length;

		let bizIdArr = [];

		if (storedUser) {
			if (numBizOwned > 1) {
				bizIdArr = Object.keys(bizOwned);

				setUser({ userData: storedUser, bizId: bizIdArr, uid: storedUid });
			} else {
				const localStorageBizId = Object.keys(bizOwned).pop();
				bizIdArr.push(localStorageBizId);

				setUser({ userData: storedUser, bizId: bizIdArr, uid: storedUid });
			}
		}

		if (bizIdArr.length === 0) {
			return;
		}

		// testCode();
		removeLocalStorage("incOrder");
		testSoundOnLaunch("start");
		updateOldSchedules(bizIdArr);
		updateYdayPaused(bizIdArr);
		const ninetyMin = 90 * 60 * 1000;
		const interval = setInterval(() => checkInterval(bizIdArr), ninetyMin);
		setLocalStorage("interval", interval);

		console.count("useEffect Layout");

		const unsubPendArr = [];
		const unsubConfirmArr = [];

		for (let i = 0; i < bizIdArr.length; i++) {
			const bizId = bizIdArr[i];

			const unsubPending = pendingNotif(bizId);

			unsubPendArr.push(unsubPending);
		}

		for (let j = 0; j < bizIdArr.length; j++) {
			const bizId = bizIdArr[j];

			const unsubConfirmed = confirmedNotif(bizId);

			unsubConfirmArr.push(unsubConfirmed);
		}

		return () => {
			for (let i = 0; i < unsubPendArr.length; i++) {
				const unsubCurrPending = unsubPendArr[i];
				unsubCurrPending();
			}

			for (let j = 0; j < unsubConfirmArr.length; j++) {
				const unsubCurrConfirm = unsubConfirmArr[j];
				unsubCurrConfirm();
			}

			releaseWakeLock();
			clearInterval(interval);
			// testSoundOnLaunch("end");
			document.removeEventListener("visibilitychange", onVisibilityChange);
			document.removeEventListener("visibilitychange", updateVersion);
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// const testCode = () => {
	// 	const ctx = new (window.AudioContext || window.webkitAudioContext)();
	// 	console.log("ctx", ctx.state);
	// };

	const testSoundOnLaunch = async (action) => {
		const testAudio = new Audio("/sounds/smsTone.mp3");
		const hasSound = await isSoundEnabled(testAudio, action);
		setIsAudioEnabled(hasSound);
	};

	// * Check for old schedules in weeklySchedules
	const updateOldSchedules = async (bizIdArr) => {
		for (let i = 0; i < bizIdArr.length; i++) {
			const bizId = bizIdArr[i];

			const resUpdatePastSchedule = await updatePastSchedules(bizId);
			const { success, message } = resUpdatePastSchedule;

			if (!success) {
				console.log("update past schedule error", message);
			}
		}
	};

	const updateYdayPaused = async (bizIdArr) => {
		for (let i = 0; i < bizIdArr.length; i++) {
			const bizIdTemp = bizIdArr[i];
			const res = await updateYdaySchedPaused(bizIdTemp);
		}
	};

	// Check if any schedules by interval. Shut down screen if no schedules
	const checkInterval = async (bizIdArr) => {
		updateVersion();
		for (let i = 0; i < bizIdArr.length; i++) {
			const bizId = bizIdArr[i];

			const bizDocRef = doc(db, "biz", bizId);

			try {
				const scheduleSnapshot = await getDoc(bizDocRef);
				const scheduleData = scheduleSnapshot.data();
				const weeklySchedules = scheduleData.weeklySchedules;

				const date = new Date();
				const shortDate = date.toDateString();
				const dayOne = date.getDay() + 1;
				date.setDate(date.getDate() + 1);
				const dayTwo = date.getDay() + 1;
				const midNight = date.setHours(0, 0, 0, 0);

				let posts = 0;

				const todaySchedules = weeklySchedules[dayOne];
				const tomorrowSchedules = weeklySchedules[dayTwo];

				for (const scheduleId in todaySchedules) {
					const currSchedule = todaySchedules[scheduleId];
					const numAvail = currSchedule.numAvailable;

					posts += numAvail;
				}

				if (posts > 0) {
					return;
				} else {
					const newDate = new Date();
					const currTime = Date.parse(newDate);

					// console.log("currTime", currTime);
					// console.log("midNight", midNight);
					if (currTime > midNight) {
						releaseWakeLock();
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
	};

	// Function that attempts to request a wake lock.
	const requestWakeLock = async () => {
		try {
			wakeLock = await navigator.wakeLock.request("screen");
			wakeLock.addEventListener("release", () => {
				// console.log("Wake Lock was released");
			});
			// window.alert("Wake Lock is active");
			// console.log("Wake Lock is active");
		} catch (err) {
			console.error(`${err.name}, ${err.message}`);
		}
	};

	// Function that attempts to release the wake lock.
	const releaseWakeLock = async () => {
		const getInterval = getLocalStorage("interval");

		if (!wakeLock) {
			return;
		}

		try {
			await wakeLock.release();
			wakeLock = null;
			clearInterval(getInterval);
		} catch (err) {
			console.error(`${err.name}, ${err.message}`);
		}
	};

	async function onVisibilityChange() {
		if (wakeLock !== null && document.visibilityState === "visible") {
			await requestWakeLock();
			// window.confirm("wake lock active");
		}
	}

	async function updateVersion() {
		const currVersion = JSON.parse(getLocalStorage("version"));

		if (document.visibilityState === "visible") {
			// console.log(currVersion);
			if (!currVersion || currVersion !== versionNumber || currVersion === "") {
				setLocalStorage("version", versionNumber);
				Router.reload();
			}
		}
	}

	const pendingNotif = (bizId) => {
		const date = new Date();
		const dateString = date.toLocaleDateString();

		const bizOrdersRef = collection(db, "biz", bizId, "orders");
		const qPending = query(
			bizOrdersRef,

			where("shortDate", "==", dateString),
			where("isNoticed", "==", false),
			where("statusIndex", "==", 0)
		);

		const unsubPending = onSnapshot(qPending, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === "added") {
					// setPendingOrders((prev) => ({
					// 	pendingCount: prev.pendingCount + 1,
					// }));

					setOpen(true);
					buttonSoundRef.current.click();
				}

				if (change.type === "removed") {
					// setPendingOrders((prev) => ({
					// 	pendingCount: prev.pendingCount - 1,
					// }));
				}
			});
		});

		return unsubPending;
	};

	const confirmedNotif = (bizId) => {
		const date = new Date();
		const dateString = date.toLocaleDateString();

		const bizOrdersRef = collection(db, "biz", bizId, "orders");
		const qUnnoticed = query(
			bizOrdersRef,
			where("shortDate", "==", dateString),
			where("statusIndex", "==", 1)
		);

		const unsubConfirmed = onSnapshot(qUnnoticed, (snapshot) => {
			snapshot.docChanges().forEach((change) => {
				if (change.type === "added") {
					setConfirmedOrders((prev) => ({
						confirmedCount: prev.confirmedCount + 1,
					}));
				}

				if (change.type === "removed") {
					setConfirmedOrders((prev) => ({
						confirmedCount: prev.confirmedCount - 1,
					}));
				}
			});
		});

		return unsubConfirmed;
	};

	const closeEnableSoundModal = () => {
		setIsAudioEnabled(true);
	};

	// * DISPLAY ----------------------------------------------------------------------

	function showIncomingOrderModal() {
		return (
			<div>
				<Modal
					open={open}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box
						sx={style}
						onClick={() => {
							playNotificationSound(audio, "end");
							handleClose();

							if (currentPage !== "Orders") {
								// const incOrder = {
								// 	isViewed: true,
								// 	count: pendingCount,
								// };
								// setLocalStorage("incOrder", incOrder);
								router.push(`/dashboard/${uid}/orders/incoming-orders`);
							}

							// if (currentPage === "Orders") {
							// 	const incOrder = {
							// 		isViewed: false,
							// 		count: pendingCount,
							// 	};
							// 	setLocalStorage("incOrder", incOrder);
							// }
						}}
						className={styles.Box}
					>
						<div className={styles.BoxContent}>
							<h1>1</h1>
							<div className={styles.BoxDescription}>
								<h2>New Order</h2>
								<p>Tap to view order</p>
							</div>
						</div>
					</Box>
				</Modal>
			</div>
		);
	}

	const handleClose = () => setOpen(false);

	if (currentPage === "public" || currentPage === "admin") {
		return (
			<React.Fragment>
				<div className={styles.Layout__One}>
					<Nav currentPage={currentPage} />
					<main>{children}</main>
				</div>
			</React.Fragment>
		);
	} else {
		return (
			<React.Fragment>
				<EnableSound
					isAudioEnabled={isAudioEnabled}
					closeEnableSoundModal={closeEnableSoundModal}
				/>
				<div className={styles.Layout}>
					{showIncomingOrderModal()}
					<Nav
						currentPage={currentPage}
						notifications={notificationsNotice}
						notificationsConfirmed={notificationsConfirmed}
					/>
					<DashMenu currentPage={currentPage} />
					<Private uid={uid}>
						<div className={styles.Layout__Main}>
							<DashHeader
								currentPage={currentPage}
								subPage={subPage}
								notifications={notificationsNotice}
								notificationsConfirmed={notificationsConfirmed}
								bizIdArr={bizId}
							/>
							<button
								ref={buttonSoundRef}
								onClick={() => {
									playNotificationSound(audio, "start");
								}}
								style={{ display: "none" }}
							>
								Play Sound
							</button>
							<main>{children}</main>
						</div>
					</Private>
				</div>
			</React.Fragment>
		);
	}
}

export default Layout;
