import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Nav from "./Nav";
import DashMenu from "./Dashboard/DashMenu";
import styles from "../styles/components/layout.module.css";
import DashHeader from "./Dashboard/DashHeader";
import Private from "./Private/Private";
import { getLocalStorage, setLocalStorage } from "../actions/auth/auth";
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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useRouter } from "next/router";
import { versionNumber } from "../staticData/versionNumber";
import { updatePastSchedules } from "../actions/dashboard/scheduleCrud";
import playNotificationSound from "../helper/PlayAudio";

const style = {
	position: "absolute",
	width: "100%",
	height: "100%",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

function Layout({ children, currentPage, subPage, uid }) {
	const [audio, setAudio] = useState(null);
	const [open, setOpen] = React.useState(false);
	const [notificationsConfirmed, setNotificationsConfirmed] = useState({
		numOrdersConfirmed: 0,
		ordersConfirmedErrorMessage: "",
		ordersConfirmedData: [],
	});
	const [notificationsNotice, setNotificationsNotice] = useState({
		numOrdersUnnoticed: 0,
		errorMessage: "",
		orderData: [],
	});
	const [user, setUser] = useState({
		userData: {},
		bizId: "",
		uid: "",
	});

	const { numOrdersUnnoticed, errorMessage, orderData } = notificationsNotice;
	const { userData, bizId } = user;

	const buttonSoundRef = useRef(null);
	const router = useRouter();
	let wakeLock = null;

	useEffect(() => {
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

		let bizIdTemp;
		if (storedUser) {
			// ! This only accounts for 1 biz, not multiple
			const bizOwned = storedUser.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ userData: storedUser, bizId: bizIdTemp, uid: storedUid });
		}

		if (!bizIdTemp) {
			return;
		}

		updateOldSchedules(bizIdTemp);
		const ninetyMin = 90 * 60 * 1000;
		const interval = setInterval(() => checkInterval(bizIdTemp), ninetyMin);
		setLocalStorage("interval", interval);

		const unsubscribeConfirmed = liveNotificationsConfirmed(bizIdTemp);
		const unsubscribeNotice = liveNotificationsNotice(bizIdTemp);

		return () => {
			unsubscribeConfirmed();
			unsubscribeNotice();
			releaseWakeLock();
			clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			document.removeEventListener("visibilitychange", updateVersion);
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// * Check for old schedules in weeklySchedules
	async function updateOldSchedules(bizId) {
		const resUpdatePastSchedule = await updatePastSchedules(bizId);
		const { success, message } = resUpdatePastSchedule;

		if (!success) {
			console.log("update past schedule error", message);
		}
	}

	// Check if any schedules by interval. Shut down screen if no schedules
	async function checkInterval(bizId) {
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

			// * Counting tomorrow's orders
			// for (const scheduleId in tomorrowSchedules) {
			// 	const currSchedule = tomorrowSchedules[scheduleId];
			// 	const numAvail = currSchedule.numAvailable;

			// 	posts += numAvail;
			// }

			if (posts > 0) {
				console.log("has orders");
				return;
			} else {
				const newDate = new Date();
				const currTime = Date.parse(newDate);

				console.log("has no orders");
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

	// Function that attempts to request a wake lock.
	const requestWakeLock = async () => {
		try {
			wakeLock = await navigator.wakeLock.request("screen");
			wakeLock.addEventListener("release", () => {
				console.log("Wake Lock was released");
			});
			// window.alert("Wake Lock is active");
			console.log("Wake Lock is active");
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
		// console.log("hi");

		if (document.visibilityState === "visible") {
			if (!currVersion || currVersion !== versionNumber) {
				setLocalStorage("version", versionNumber);
				router.reload();
			}
		}
	}

	const liveNotificationsConfirmed = (bizIdTemp) => {
		const date = new Date();
		const dateString = date.toLocaleDateString();

		const bizOrdersRef = collection(db, "biz", bizIdTemp, "orders");
		const queryUnnoticed = query(
			bizOrdersRef,
			where("shortDate", "==", dateString),
			where("status", "==", "Confirmed")
		);
		const unsubscribe = onSnapshot(
			queryUnnoticed,
			(querySnap) => {
				const ordersArr = [];
				querySnap.forEach((doc) => {
					const data = doc.data();
					data.orderId = doc.id;
					ordersArr.push(data);
				});
				const queryLength = querySnap.size;

				setNotificationsConfirmed({
					numOrdersConfirmed: queryLength,
					ordersConfirmedData: ordersArr,
					ordersConfirmedErrorMessage: "",
				});
			},
			(error) => {
				console.log(error);
				setNotificationsConfirmed({
					ordersConfirmedErrorMessage: `Error fetching notifications: ${error}`,
				});
			}
		);

		return unsubscribe;
	};

	const liveNotificationsNotice = (bizIdTemp) => {
		const date = new Date();
		const dateString = date.toLocaleDateString();

		const bizOrdersRef = collection(db, "biz", bizIdTemp, "orders");
		const queryUnnoticed = query(
			bizOrdersRef,
			where("shortDate", "==", dateString),
			where("isNoticed", "==", false)
		);

		const unsubscribe = onSnapshot(
			queryUnnoticed,
			(querySnap) => {
				const ordersArr = [];
				querySnap.forEach((doc) => {
					const data = doc.data();
					data.orderId = doc.id;
					ordersArr.push(data);
				});
				const queryLength = querySnap.size;
				setNotificationsNotice({
					numOrdersUnnoticed: queryLength,
					orderData: ordersArr,
					errorMessage: "",
				});
				if (queryLength && queryLength > 0) {
					const incOrderCount = JSON.parse(getLocalStorage("incOrder"));
					if (incOrderCount) {
						const { isViewed, count } = incOrderCount;

						if (!isViewed) {
							// * Play notification sound
							buttonSoundRef.current.click();
							handleOpen();
						}
					} else {
						handleOpen();
						// * Play notification sound
						buttonSoundRef.current.click();
					}
				}

				// * Set isViewed is false so new orders coming in can be seen.
				const incOrder = {
					isViewed: false,
					count: queryLength,
				};
				setLocalStorage("incOrder", incOrder);
			},
			(error) => {
				setNotificationsNotice({
					errorMessage: `Error fetching notifications: ${error}`,
				});
			}
		);

		return unsubscribe;
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
							const incOrder = {
								isViewed: true,
								count: numOrdersUnnoticed,
							};

							handleClose();
							setLocalStorage("incOrder", incOrder);
							if (currentPage === "Orders") {
								const incOrder = {
									isViewed: false,
									count: numOrdersUnnoticed,
								};
								setLocalStorage("incOrder", incOrder);
							}
							playNotificationSound(audio, "end");

							router.push(`/dashboard/${uid}/orders/incoming-orders`);
						}}
						className={styles.Box}
					>
						<div className={styles.BoxContent}>
							<h1>{numOrdersUnnoticed}</h1>
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

	const handleOpen = () => setOpen(true);
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
								bizId={bizId}
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
