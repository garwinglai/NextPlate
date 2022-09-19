import React, { useState, useEffect } from "react";
import Layout from "../../../../Components/Layout";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/incoming-orders.module.css";
import OrdersComponent from "../../../../Components/Dashboard/Orders/Incoming/OrdersComponent";
import { updatePastOrders } from "../../../../actions/dashboard/ordersCrud";
import {
	getLocalStorage,
	setLocalStorage,
} from "../../../../actions/auth/auth";
import { db } from "../../../../firebase/fireConfig";
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
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { CircularProgress } from "@mui/material";
import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import { getBiz } from "../../../../actions/crud/bizUser";
import SuccessError from "../../../../Components/Dashboard/Orders/SuccessError";
import getProducts from "../../../../actions/dashboard/productsCrud";
import playNotificationSound from "../../../../helper/PlayAudio";
import FlashSale from "../../../../Components/Dashboard/Orders/Incoming/FlashSale";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

function IncomingOrders() {
	const [audio, setAudio] = useState(null);
	const [value, setValue] = useState(0);

	const [pendingOrders, setPendingOrders] = useState({
		pendingCount: 0,
	});

	const [confirmedOrders, setConfirmedOrders] = useState({
		confirmedCount: 0,
	});

	const [handleScheduleUpdates, setHandleScheduleUpdates] = useState({
		errorMessage: "",
		successMessage: "",
		isOpen: false,
	});

	const [scheduleNowValues, setScheduleNowValues] = useState({
		showScheduleModal: false,
	});

	const [userDataValues, setUserDataValues] = useState({
		loading: false,
		message: "",
		userData: [],
	});

	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});

	const { pendingCount } = pendingOrders;
	const { confirmedCount } = confirmedOrders;
	const { storedUser, bizId } = user;
	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
	const { loading, message, userData } = userDataValues;
	const { showScheduleModal } = scheduleNowValues;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUser = JSON.parse(getLocalStorage("user"));
		const bizOwned = storedUser.bizOwned;
		const numBizOwned = Object.keys(bizOwned).length;

		let bizIdArr = [];

		if (storedUser) {
			if (numBizOwned > 1) {
				bizIdArr = Object.keys(bizOwned);

				setUser({ storedUser, bizId: bizIdArr });
			} else {
				const localStorageBizId = Object.keys(bizOwned).pop();
				bizIdArr.push(localStorageBizId);

				setUser({ storedUser, bizId: bizIdArr });
			}
		}

		// * Set audio if null
		if (audio === null) {
			setAudio(new Audio("/sounds/smsTone.mp3"));
		}

		if (bizIdArr.length === 0) {
			return;
		}

		loadUserData(bizIdArr);
		updatePast(bizIdArr);

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
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid]);

	const updatePast = async (bizIdArr) => {
		for (let i = 0; i < bizIdArr.length; i++) {
			const currBizId = bizIdArr[i];
			const res = updatePastOrders(currBizId);
		}
	};

	const loadUserData = async (bizIdArr) => {
		setUserDataValues((prev) => ({
			...prev,
			loading: true,
			message: "",
		}));

		const dateArr = [];
		const date = new Date();
		const shortDate = date.toLocaleDateString();
		dateArr.push(shortDate);
		date.setDate(date.getDate() + 1);
		const shortDateTwo = date.toLocaleDateString();
		dateArr.push(shortDateTwo);

		let bizDataArr = [];

		for (let i = 0; i < bizIdArr.length; i++) {
			const bizIdTemp = bizIdArr[i];

			const resUser = await getBiz(bizIdTemp, dateArr);
			const { success, message } = resUser;

			if (success) {
				const resUserData = resUser.docData;
				const emojiBiz = resUserData.emoji;
				const ordersArr = resUser.ordersArr;
				const bName = resUser.docData.name;

				const bizInfo = {
					data: resUserData,
					bizId: bizIdTemp,
					bizName: bName,
					ordersDataArr: ordersArr,
					emoji: emojiBiz,
				};

				bizDataArr.push(bizInfo);
			} else {
				// TODO: handle Error
				console.log("error getting user data");
				setUserDataValues((prev) => ({
					loading: false,
					message: "",
				}));
			}
		}

		setUserDataValues((prev) => ({
			loading: false,
			message: "",
			userData: bizDataArr,
		}));
	};

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
					setPendingOrders((prev) => ({
						pendingCount: prev.pendingCount + 1,
					}));
				}

				if (change.type === "removed") {
					setPendingOrders((prev) => ({
						pendingCount: prev.pendingCount - 1,
					}));
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

	// * Actions ---------------------------------------------------------------

	function handleFlashClick(e) {
		setScheduleNowValues((prev) => ({
			...prev,
			showScheduleModal: true,
		}));
	}

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	const closeFlashSale = () => {
		setScheduleNowValues((prev) => ({
			...prev,
			showScheduleModal: false,
		}));
	};

	const setUserData = (userData) => {
		console.log("data reset", userData);

		setUserDataValues((prev) => ({
			loading: false,
			message: "",
			userData,
		}));
	};

	// * Displays ---------------------------------------------------------------
	return (
		<Layout
			uid={uid}
			currentPage="Orders"
			subPage="incoming-orders"
			pendingCount={pendingCount}
		>
			{loading && <CircularProgress />}
			{errorMessage && (
				<SuccessError
					handleOrderUpdate={handleScheduleUpdates}
					setHandleOrderUpdates={setHandleScheduleUpdates}
				/>
			)}
			<div className={styles.IncomingOrders__container}>
				{!loading && (
					<Button variant="contained" onClick={handleFlashClick}>
						⚡️ Flash Sale
					</Button>
				)}
				{showScheduleModal && (
					<FlashSale
						open={showScheduleModal}
						close={closeFlashSale}
						userData={userData}
						loadUserData={loadUserData}
						bizIdArr={bizId}
					/>
				)}
				<Box sx={{ width: "100%" }}>
					<Box
						sx={{
							// borderBottom: 1,
							borderColor: "divider",
							width: "100%",
						}}
					>
						<div className={styles.tab__container}>
							<Tabs
								value={value}
								onChange={handleChange}
								aria-label="basic tabs example"
								className={styles.tab__Group}
							>
								<Tab label="Pending" {...a11yProps(0)} className={styles.tab} />
								<Tab label="Pickup" {...a11yProps(1)} className={styles.tab} />
							</Tabs>
							{pendingCount && pendingCount !== 0 ? (
								<p className={`${styles.pendingCount}`}>{pendingCount}</p>
							) : (
								<p style={{ display: "none" }}>hidden</p>
							)}
							{confirmedCount && confirmedCount !== 0 ? (
								<p className={`${styles.confirmedCount}`}>{confirmedCount}</p>
							) : (
								<p style={{ display: "none" }}>hidden</p>
							)}
						</div>
					</Box>

					<TabPanel value={value} index={0}>
						<OrdersComponent tab={0} userData={userData} />
					</TabPanel>
					<TabPanel value={value} index={1}>
						<OrdersComponent tab={1} userData={userData} />
					</TabPanel>
				</Box>
			</div>
		</Layout>
	);
}

export default IncomingOrders;
