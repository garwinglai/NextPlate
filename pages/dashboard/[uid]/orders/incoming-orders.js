import React, { useState, useEffect } from "react";
import Layout from "../../../../Components/Layout";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/incoming-orders.module.css";
import OrdersComponent from "../../../../Components/Dashboard/Orders/OrdersComponent";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase/fireConfig";
import { updatePastOrders } from "../../../../actions/dashboard/ordersCrud";
import { getLocalStorage } from "../../../../actions/auth/auth";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { CircularProgress } from "@mui/material";
import { Button, Grid } from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { getBiz } from "../../../../actions/crud/bizUser";
import { createFlashSchedule } from "../../../../actions/dashboard/scheduleCrud";
import SuccessError from "../../../../Components/Dashboard/Orders/SuccessError";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 350,
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

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
	const [value, setValue] = useState(0);
	const [handleScheduleUpdates, setHandleScheduleUpdates] = useState({
		errorMessage: "",
		successMessage: "",
		isOpen: false,
	});
	const [flash, setFlash] = useState({
		postsFlash: [],
		timeDisplaysFlash: [],
		hasFlashOnDateComponent: false,
		errorLoadingFlash: "",
		currShortDate: "",
	});
	const [scheduleNowValues, setScheduleNowValues] = useState({
		scheduleNowLoading: false,
		scheduleNowMessage: "",
		showScheduleNowAlert: false,
		showScheduleModal: false,
		numAvailable: 1,
		numHours: "1",
	});
	const [userDataValues, setUserDataValues] = useState({
		loading: false,
		userData: [],
		message: "",
		ordersDataArr: [],
	});
	const [ordersPendingValues, setOrdersPendingValues] = useState({
		ordersPendingLoading: false,
		ordersPendingMessage: "",
		ordersPending: [],
		pickupWindowsPending: [],
		hasPendingToday: false,
		hasPendingTomorrow: false,
		pendingCount: 0,
	});
	const [ordersConfirmedValues, setOrdersConfirmedValues] = useState({
		ordersConfirmedLoading: false,
		ordersConfirmedMessage: "",
		ordersConfirmed: [],
		pickupWindowsConfirmed: [],
		hasConfirmedToday: false,
		hasConfirmedTomorrow: false,
		confirmedCount: 0,
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [twoDates, setTwoDates] = useState([
		{
			weekDayNameShort: "",
			shortDate: "",
			statusTodayOrTomorrow: 0,
			actualDate: "",
			dayIndex: "",
		},
	]);

	const { storedUser, bizId } = user;

	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
	const { loading, userData, message, ordersDataArr } = userDataValues;
	const {
		postsFlash,
		timeDisplaysFlash,
		hasFlashOnDateComponent,
		errorLoadingFlash,
		currShortDate,
	} = flash;
	const {
		scheduleNowLoading,
		scheduleNowMessage,
		showScheduleNowAlert,
		showScheduleModal,
		numAvailable,
		numHours,
	} = scheduleNowValues;
	const {
		ordersPendingLoading,
		ordersPendingMessage,
		ordersPending,
		pickupWindowsPending,
		hasPendingToday,
		hasPendingTomorrow,
		pendingCount,
	} = ordersPendingValues;
	const {
		ordersConfirmedLoading,
		ordersConfirmedMessage,
		ordersConfirmed,
		pickupWindowsConfirmed,
		hasConfirmedToday,
		hasConfirmedTomorrow,
		confirmedCount,
	} = ordersConfirmedValues;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUser = JSON.parse(getLocalStorage("user"));
		let bizIdTemp;
		if (storedUser) {
			// ! This only accounts for 1 biz, not multiple
			const bizOwned = storedUser.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ storedUser, bizId: bizIdTemp });
		}

		if (!bizIdTemp) {
			return;
		}
		loadDates();
		loadUserData(bizIdTemp);
		const unsubscribePendingOrders = loadPendingOrdersData(bizIdTemp);
		const unsubscribeConfirmedOrders = loadConfirmedOrdersData(bizIdTemp);
		updatePast(bizIdTemp);

		return () => {
			unsubscribePendingOrders();
			unsubscribeConfirmedOrders();
		};
	}, [uid]);

	async function updatePast(bizIdTemp) {
		const res = await updatePastOrders(bizIdTemp);
	}

	async function loadUserData(bizIdTemp) {
		setUserDataValues((prev) => ({
			...prev,
			loading: true,
			message: "",
			userData: [],
		}));

		const dateArr = [];
		const date = new Date();
		const shortDate = date.toLocaleDateString();
		dateArr.push(shortDate);
		date.setDate(date.getDate() + 1);
		const shortDateTwo = date.toLocaleDateString();
		dateArr.push(shortDateTwo);

		const resUser = await getBiz(bizIdTemp, dateArr);
		if (resUser.success) {
			const resUserData = resUser.docData;
			const ordersArr = resUser.ordersArr;

			setUserDataValues((prev) => ({
				...prev,
				userData: resUserData,
				loading: false,
				message: "",
				ordersDataArr: ordersArr,
			}));
		} else {
			setUserDataValues((prev) => ({
				...prev,
				loading: false,
				message: resUser.message,
			}));
		}
	}

	function loadPendingOrdersData(bizIdTemp) {
		setOrdersPendingValues({
			ordersPendingLoading: true,
			ordersPendingMessage: "",
		});
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		const ordersCollectionRef = collection(db, "biz", bizIdTemp, "orders");
		const q = query(
			ordersCollectionRef,
			where("shortDate", "in", dateArr),
			where("status", "==", "Reserved")
		);

		const unsubscribePendingOrders = onSnapshot(
			q,
			(querySnapshot) => {
				const ordersArr = [];
				const pickupWindows = [];
				let pendingToday = false;
				let pendingTomorrow = false;

				querySnapshot.forEach((doc) => {
					const orderData = doc.data();
					orderData.orderId = doc.id;
					ordersArr.push(orderData);
				});

				const sortedOrdersArr = ordersArr.sort(
					(a, b) => a.startTime - b.startTime
				);

				for (let i = 0; i < sortedOrdersArr.length; i++) {
					const curr = sortedOrdersArr[i];
					const currWindow = curr.pickupWindow;

					if (!pickupWindows.some((obj) => obj.window === currWindow)) {
						const pickup = {
							window: curr.pickupWindow,
							shortDate: curr.shortDate,
						};
						pickupWindows.push(pickup);
					}

					if (dateArr[0] === curr.shortDate) {
						pendingToday = true;
					}

					if (dateArr[1] === curr.shortDate) {
						pendingTomorrow = true;
					}
				}

				setOrdersPendingValues({
					ordersPendingLoading: false,
					ordersPending: ordersArr,
					pickupWindowsPending: pickupWindows,
					hasPendingToday: pendingToday,
					hasPendingTomorrow: pendingTomorrow,
					pendingCount: ordersArr.length,
				});
			},
			(error) => {
				setOrdersPendingValues({
					ordersPendingLoading: false,
					ordersPendingMessage: `Error fetching orders: ${error}`,
				});
			}
		);

		return unsubscribePendingOrders;
	}

	function loadConfirmedOrdersData(bizIdTemp) {
		setOrdersConfirmedValues({
			ordersConfirmedLoading: true,
			ordersConfirmedMessage: "",
		});
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}
		const ordersCollectionRef = collection(db, "biz", bizIdTemp, "orders");
		const q = query(
			ordersCollectionRef,
			where("shortDate", "in", dateArr),
			where("status", "==", "Confirmed")
		);

		const unsubscribePendingOrders = onSnapshot(
			q,
			(querySnapshot) => {
				const ordersArr = [];
				const pickupWindows = [];

				querySnapshot.forEach((doc) => {
					const orderData = doc.data();
					orderData.orderId = doc.id;
					ordersArr.push(orderData);
				});

				const sortedOrdersArr = ordersArr.sort(
					(a, b) => a.startTime - b.startTime
				);

				let confirmedToday = false;
				let confirmedTomorrow = false;

				for (let i = 0; i < sortedOrdersArr.length; i++) {
					const curr = sortedOrdersArr[i];
					const currWindow = curr.pickupWindow;

					if (!pickupWindows.some((obj) => obj.window === currWindow)) {
						const pickup = {
							window: curr.pickupWindow,
							shortDate: curr.shortDate,
						};
						pickupWindows.push(pickup);
					}

					if (dateArr[0] === curr.shortDate) {
						confirmedToday = true;
					}

					if (dateArr[1] === curr.shortDate) {
						confirmedTomorrow = true;
					}
				}

				setOrdersConfirmedValues({
					ordersConfirmedLoading: false,
					ordersConfirmed: ordersArr,
					pickupWindowsConfirmed: pickupWindows,
					hasConfirmedToday: confirmedToday,
					hasConfirmedTomorrow: confirmedTomorrow,
					confirmedCount: ordersArr.length,
				});
			},
			(error) => {
				setOrdersConfirmedValues({
					ordersConfirmedLoading: false,
					ordersConfirmedMessage: `Error fetching orders: ${error}`,
				});
			}
		);

		return unsubscribePendingOrders;
	}

	function loadDates() {
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const weekDayIndex = date.getDay() + 1;
			let tempData = {};
			tempData.shortDate = date.toLocaleDateString();
			tempData.statusTodayOrTomorrow = i;
			tempData.actualDate = date.toDateString();
			tempData.dayIndex = weekDayIndex;

			switch (weekDayIndex) {
				case 1:
					tempData.weekDayNameShort = "Sun";
					break;
				case 2:
					tempData.weekDayNameShort = "Mon";
					break;
				case 3:
					tempData.weekDayNameShort = "Tue";
					break;
				case 4:
					tempData.weekDayNameShort = "Wed";
					break;
				case 5:
					tempData.weekDayNameShort = "Thur";
					break;
				case 6:
					tempData.weekDayNameShort = "Fri";
					break;
				case 7:
					tempData.weekDayNameShort = "Sat";
					break;
				default:
					break;
			}

			dateArr.push(tempData);
		}
		setTwoDates(dateArr);
	}

	// * Displays ---------------------------------------------------------------
	function showScheduleNowModal() {
		const date = new Date();
		const currHour = date.getHours();
		const currMin = date.getMinutes();

		let disable1Hr = false;
		let disable2Hr = false;
		let disable3Hr = false;

		if (currHour === 22) {
			disable3Hr = true;
		}

		if (currHour === 23) {
			disable2Hr = true;
			disable3Hr = true;

			if (currMin !== 0) {
				disable1Hr = true;
			}
		}

		return (
			<Modal
				open={showScheduleModal}
				onClose={() =>
					setScheduleNowValues((prev) => ({
						...prev,
						showScheduleModal: false,
						numAvailable: 1,
						numHours: "1",
						showScheduleNowAlert: false,
					}))
				}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					{scheduleNowMessage && (
						<Grid item xs={12} md={12} mb={2}>
							<Collapse in={showScheduleNowAlert}>
								<Alert
									severity={"error"}
									onClose={() => {
										setScheduleNowValues((prev) => ({
											...prev,
											showScheduleNowAlert: false,
										}));
									}}
								>
									{scheduleNowMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					<div className={styles.ScheduleModal__container}>
						<div className={` ${styles.Schedule__meals}`}>
							<p>How many meals?</p>
							<input
								className={styles.CreateSchedule__currentInput}
								id="quantity"
								type="number"
								placeholder="0"
								min="1"
								autoFocus
								value={numAvailable}
								onChange={handleFlashChange}
								name="numAvailable"
								required
							/>
						</div>
						<div className={styles.Schedule__scheduleModal}>
							<div>
								<p>How many hours?</p>
								<p
									style={{
										color: "var(--gray)",
										fontSize: "12px",
										marginTop: "10px",
									}}
								>
									Last schedule before 11pm.
								</p>
								<p
									style={{
										color: "var(--gray)",
										fontSize: "12px",
										marginTop: "10px",
									}}
								>
									(12am - 11:59pm)
								</p>
							</div>
							<div className={styles.RadioGroup}>
								<div className={styles.Radio}>
									<input
										className={styles.CreateSchedule__currentInput}
										id="one"
										type="radio"
										disabled={disable1Hr}
										checked={numHours === "1"}
										value={1}
										onChange={handleFlashChange}
										name="numHours"
									/>
									<label htmlFor="one">1 hr</label>
								</div>
								<div className={styles.Radio}>
									<input
										className={styles.CreateSchedule__currentInput}
										id="two"
										type="radio"
										disabled={disable2Hr}
										checked={numHours === "2"}
										value={2}
										onChange={handleFlashChange}
										name="numHours"
									/>
									<label htmlFor="two">2 hr</label>
								</div>
							</div>
						</div>
						<Button
							variant={"contained"}
							size="large"
							onClick={handleCreateNow}
							color={"primary"}
						>
							{"+ Create"}
						</Button>
					</div>
				</Box>
			</Modal>
		);
	}

	// * Actions ---------------------------------------------------------------
	async function handleCreateNow(e) {
		const numHoursInt = parseInt(numHours);
		const numAvailInt = parseInt(numAvailable);

		if (numAvailInt < 1 || !numAvailable) {
			setScheduleNowValues((prev) => ({
				...prev,
				scheduleNowMessage: "Please input at least 1 meal.",
				showScheduleNowAlert: true,
			}));
			return;
		}

		if (numHoursInt === 0) {
			setScheduleNowValues((prev) => ({
				...prev,
				scheduleNowMessage: "Please select how many hours.",
				showScheduleNowAlert: true,
			}));
			return;
		}
		setScheduleNowValues((prev) => ({ ...prev, scheduleNowLoading: true }));

		const {
			itemName,
			itemDescription,
			defaultPrice,
			originalPrice,
			allergens,
		} = userData;

		const itemPriceDoubleConvert = parseFloat(defaultPrice.slice(1));
		const itemPricePennyConvert = itemPriceDoubleConvert * 100;

		const date = new Date();
		const currShortDate = date.toLocaleDateString();
		const startTimeEpochMiliSec = Date.parse(date);
		const endTimeEpochMiliSec =
			numHoursInt * 60 * 60 * 1000 + startTimeEpochMiliSec;

		const dateStart = new Date(startTimeEpochMiliSec);
		const dateEnd = new Date(endTimeEpochMiliSec);
		const timeStart = dateStart.toLocaleTimeString("en-US", { hour12: false });
		const timeEnd = dateEnd.toLocaleTimeString("en-US", { hour12: false });
		let hourStart = parseInt(timeStart.split("").slice(0, 2).join(""));
		let minStart = parseInt(timeStart.split("").slice(3, 5).join(""));
		let hourEnd = parseInt(timeEnd.split("").slice(0, 2).join(""));
		let minEnd = parseInt(timeEnd.split("").slice(3, 5).join(""));

		if (0 < minEnd && minEnd <= 15) {
			minEnd = 15;
		} else if (15 < minEnd && minEnd <= 30) {
			minEnd = 30;
		} else if (30 < minEnd && minEnd <= 45) {
			minEnd = 45;
		} else if (45 < minEnd && minEnd <= 59) {
			hourEnd += 1;
			minEnd = 0;
		}

		if (hourEnd === 24) {
			hourEnd = 1;
		} else if (hourEnd === 25) {
			hourEnd = 2;
		} else if (hourEnd === 26) {
			hourEnd = 3;
		}

		const startTimeString = new Date(
			date.toDateString() + " " + hourStart + ":" + minStart
		).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "numeric",
			hour12: true,
		});
		const endTimeString = new Date(
			date.toDateString() + " " + hourEnd + ":" + minEnd
		).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "numeric",
			hour12: true,
		});

		const timeDisplay = startTimeString + " - " + endTimeString;

		let weekdayShort;
		const dayIndex = date.getDay() + 1;

		switch (date.getDay()) {
			case 0:
				weekdayShort = "Sun";
				break;
			case 1:
				weekdayShort = "Mon";
				break;
			case 2:
				weekdayShort = "Tue";
				break;
			case 3:
				weekdayShort = "Wed";
				break;
			case 4:
				weekdayShort = "Thur";
				break;
			case 5:
				weekdayShort = "Fri";
				break;
			case 6:
				weekdayShort = "Sat";
				break;
			default:
				break;
		}

		const flashScheduledData = {
			itemName,
			itemDescription,
			itemPrice: defaultPrice,
			itemPriceDouble: itemPriceDoubleConvert,
			itemPricePenny: itemPricePennyConvert,
			numAvailable: numAvailInt,
			numAvailableStart: numAvailInt,
			startTime: startTimeEpochMiliSec,
			endTime: endTimeEpochMiliSec,
			timeDisplay,
			hourStart,
			minStart,
			hourEnd,
			minEnd,
			recurring: false,
			scheduledDate: date.toDateString(),
			scheduledDateShort: date.toLocaleDateString(),
			dayOfWeek: weekdayShort,
			dayOfWkIdx: dayIndex,
			status: "Flash",
			statusIndex: 1,
			flashDay: currShortDate,
		};

		const resFlashSchedule = await createFlashSchedule(
			bizId,
			dayIndex,
			flashScheduledData,
			endTimeEpochMiliSec,
			currShortDate
		);

		if (resFlashSchedule.success) {
			setHandleScheduleUpdates((prev) => ({
				...prev,
				errorMessage: "",
				successMessage: "Success.",
				isOpen: true,
			}));
			setScheduleNowValues((prev) => ({
				...prev,
				loading: false,
				showScheduleModal: false,
			}));
		} else {
			setScheduleNowValues((prev) => ({
				...prev,
				loading: false,
				scheduleNowMessage: resFlashSchedule.message,
				showScheduleNowAlert: true,
			}));
		}
	}

	function handleFlashChange(e) {
		const { name, value } = e.target;

		setScheduleNowValues((prev) => ({
			...prev,
			[name]: value,
			showScheduleNowAlert: false,
		}));
	}

	function handleScheduleNow(e) {
		setScheduleNowValues((prev) => ({ ...prev, showScheduleModal: true }));
	}

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};
	console.log(pendingCount);
	return (
		<Layout uid={uid} currentPage="Orders" subPage="incoming-orders">
			{ordersConfirmedLoading || (ordersPendingLoading && <CircularProgress />)}
			{(errorMessage || successMessage) && (
				<SuccessError
					handleOrderUpdate={handleScheduleUpdates}
					setHandleOrderUpdates={setHandleScheduleUpdates}
				/>
			)}
			<div className={styles.IncomingOrders__container}>
				<Button variant="contained" onClick={handleScheduleNow}>
					⚡️ Flash Sale
				</Button>
				{showScheduleNowModal()}
				<Box sx={{ width: "100%" }}>
					<Box
						sx={{
							borderBottom: 1,
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
						<OrdersComponent
							date={twoDates[0]}
							tab={0}
							uid={uid}
							bizId={bizId}
							ordersPending={ordersPending}
							pickupWindowsPending={pickupWindowsPending}
							hasPendingToday={hasPendingToday}
							hasPendingTomorrow={hasPendingTomorrow}
							ordersConfirmed={ordersConfirmed}
							pickupWindowsConfirmed={pickupWindowsConfirmed}
							hasConfirmedToday={hasConfirmedToday}
							hasConfirmedTomorrow={hasConfirmedTomorrow}
							ordersPendingMessage={ordersPendingMessage}
							ordersConfirmedMessage={ordersConfirmedMessage}
						/>
					</TabPanel>
					<TabPanel value={value} index={1}>
						<OrdersComponent
							date={twoDates[0]}
							tab={1}
							uid={uid}
							bizId={bizId}
							ordersPending={ordersPending}
							pickupWindowsPending={pickupWindowsPending}
							hasPendingToday={hasPendingToday}
							hasPendingTomorrow={hasPendingTomorrow}
							ordersConfirmed={ordersConfirmed}
							pickupWindowsConfirmed={pickupWindowsConfirmed}
							hasConfirmedToday={hasConfirmedToday}
							hasConfirmedTomorrow={hasConfirmedTomorrow}
							ordersPendingMessage={ordersPendingMessage}
							ordersConfirmedMessage={ordersConfirmedMessage}
						/>
					</TabPanel>
				</Box>
			</div>
		</Layout>
	);
}

export default IncomingOrders;
