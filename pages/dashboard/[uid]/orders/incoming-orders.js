import React, { useState, useEffect } from "react";
import Layout from "../../../../Components/Layout";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/incoming-orders.module.css";
import OrdersComponent from "../../../../Components/Dashboard/Orders/Incoming/OrdersComponent";
import {
	collection,
	query,
	where,
	onSnapshot,
	doc,
	getDocs,
} from "firebase/firestore";
import { db } from "../../../../firebase/fireConfig";
import { updatePastOrders } from "../../../../actions/dashboard/ordersCrud";
import {
	getLocalStorage,
	setLocalStorage,
} from "../../../../actions/auth/auth";
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
import getProducts from "../../../../actions/dashboard/productsCrud";
import playNotificationSound from "../../../../helper/PlayAudio";
import RemoveSchedule from "../../../../Components/Dashboard/Orders/Incoming/RemoveSchedule";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	width: "max-content",
	transform: "translate(-50%, -50%)",
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
	const [openSchedule, setOpenSchedule] = useState(false);
	const [audio, setAudio] = useState(null);
	// * Tab Values
	const [value, setValue] = useState(0);
	const [flashScheduleLoading, setFlashScheduleLoading] = useState(false);
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
	const [defaultItemName, setDefaultItemName] = useState("");
	const [scheduleNowValues, setScheduleNowValues] = useState({
		scheduleNowLoading: false,
		scheduleNowMessage: "",
		showScheduleNowAlert: false,
		showScheduleModal: false,
		numAvailable: "1",
		numMins: "60",
		products: [],
		itemName: "",
	});
	const [userDataValues, setUserDataValues] = useState({
		loading: false,
		userData: [],
		message: "",
		ordersDataArr: [],
		emoji: "🍽",
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
	const [scheduleValues, setScheduleValues] = useState({
		scheduleNumAvail: 0,
		pausedNumAvail: 0,
		scheduleDate: new Date().toLocaleDateString(),
		scheduleOpen: false,
		schedules: [],
		timeDisplay: [],
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
	const {
		scheduleNumAvail,
		pausedNumAvail,
		scheduleDate,
		scheduleOpen,
		schedules,
		timeDisplay,
	} = scheduleValues;
	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
	const { loading, userData, message, ordersDataArr, emoji } = userDataValues;
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
		numMins,
		products,
		itemName,
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
	const arrayOfTwenty = [
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		"10",
		"20",
	];

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		document.addEventListener("visibilitychange", onPageChangeVisibility);
		const storedUser = JSON.parse(getLocalStorage("user"));
		let bizIdTemp;
		if (storedUser) {
			// ! This only accounts for 1 biz, not multiple
			const bizOwned = storedUser.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ storedUser, bizId: bizIdTemp });
		}

		// * Set audio if null
		if (audio === null) {
			setAudio(new Audio("/sounds/smsTone.mp3"));
		}

		if (!bizIdTemp) {
			return;
		}

		loadDates();
		loadProducts(bizIdTemp);
		loadUserData(bizIdTemp);
		updatePast(bizIdTemp);
		const unsubscribePendingOrders = loadPendingOrdersData(bizIdTemp);
		const unsubscribeConfirmedOrders = loadConfirmedOrdersData(bizIdTemp);
		const unsubscribeSchedules = loadSchedules(bizIdTemp);

		return () => {
			unsubscribePendingOrders();
			unsubscribeConfirmedOrders();
			unsubscribeSchedules();
			document.removeEventListener("visibilitychange", onPageChangeVisibility);
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid]);

	async function onPageChangeVisibility() {
		const date = new Date();
		const currShortDate = date.toLocaleDateString();
		const localStorageDate = JSON.parse(getLocalStorage("currentDate"));

		if (
			currShortDate === localStorageDate &&
			document.visibilityState === "visible"
		) {
			loadDates();
			// window.confirm("loaded dates");
		}
	}

	async function updatePast(bizIdTemp) {
		const res = await updatePastOrders(bizIdTemp);
	}

	async function loadProducts(bizId) {
		const productRes = await getProducts(bizId);
		const { success, message, productsArr } = productRes;
		if (success) {
			const isDefaultItemName = productsArr.filter((item) => item.isDefault)[0]
				.itemName;
			setScheduleNowValues((prev) => ({
				...prev,
				products: productsArr,
				itemName: isDefaultItemName,
			}));
			setDefaultItemName(isDefaultItemName);
		} else {
			// TODO: handleError
			console.log("loadProducts", message);
		}
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
			const emojiBiz = resUserData.emoji;
			const ordersArr = resUser.ordersArr;

			setUserDataValues((prev) => ({
				...prev,
				userData: resUserData,
				loading: false,
				message: "",
				ordersDataArr: ordersArr,
				emoji: emojiBiz,
			}));
		} else {
			setUserDataValues((prev) => ({
				...prev,
				loading: false,
				message: resUser.message,
			}));
		}
	}

	function loadSchedules(bizId) {
		const bizDocRef = doc(db, "biz", bizId);

		const date = new Date();
		const dayOne = date.getDay() + 1;

		const unsubscribeSchedules = onSnapshot(
			bizDocRef,
			(doc) => {
				const data = doc.data();
				const weeklySchedules = data.weeklySchedules;
				const pausedSchedules = data.pausedSchedules;
				const timeDisplayArr = [];
				const tempTimeDisplayArr = [];
				const schedulesArr = [];
				let posts = 0;
				let paused = 0;
				let todayPaused;
				let todaySchedules;

				if (weeklySchedules !== undefined) {
					todaySchedules = weeklySchedules[dayOne];
				}

				if (pausedSchedules !== undefined) {
					todayPaused = pausedSchedules[dayOne];
				}
				const newDate = new Date();
				const currEpochTime = Date.parse(newDate);

				// * Count today's schedules
				for (const scheduleId in todaySchedules) {
					const currSchedule = todaySchedules[scheduleId];
					const numAvail = currSchedule.numAvailable;
					const scheduleEndTime = currSchedule.endTime;
					const timeObj = {
						startTime: currSchedule.startTime,
						timeDisplay: currSchedule.timeDisplay,
						hourStart: currSchedule.hourStart,
						minStart: currSchedule.minStart,
					};

					if (!tempTimeDisplayArr.includes(currSchedule.timeDisplay)) {
						timeDisplayArr.push(timeObj);
						tempTimeDisplayArr.push(currSchedule.timeDisplay);
					}

					schedulesArr.push(currSchedule);

					if (scheduleEndTime > currEpochTime) {
						posts += numAvail;
					}
				}

				// * Count paused schedules
				for (const pausedId in todayPaused) {
					const currPaused = todayPaused[pausedId];
					const numAvail = currPaused.numAvailable;
					const timeObj = {
						startTime: currPaused.startTime,
						timeDisplay: currPaused.timeDisplay,
						hourStart: currPaused.hourStart,
						minStart: currPaused.minStart,
					};

					if (!tempTimeDisplayArr.includes(currPaused.timeDisplay)) {
						timeDisplayArr.push(timeObj);
						tempTimeDisplayArr.push(currPaused.timeDisplay);
					}
					paused += numAvail;
					schedulesArr.push(currPaused);
				}

				setScheduleValues((prev) => ({
					...prev,
					scheduleNumAvail: posts,
					pausedNumAvail: paused,
					scheduleOpen: true,
					schedules: schedulesArr,
					timeDisplay: timeDisplayArr,
				}));
			},
			(error) => {
				console.log(error);
			}
		);

		return unsubscribeSchedules;
	}

	function loadPendingOrdersData(bizIdTemp) {
		setOrdersPendingValues({
			ordersPendingLoading: true,
			ordersPendingMessage: "",
		});

		// * Loading orders for 2 dates
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		// * Loading orders for 1 date
		const today = new Date();
		const todayShort = today.toLocaleDateString();

		const ordersCollectionRef = collection(db, "biz", bizIdTemp, "orders");
		const q = query(
			ordersCollectionRef,
			where("shortDate", "==", todayShort),
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

				// playNotificationSound(audio, "start");

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

		// * Loading orders for 2 dates
		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		// * Loading orders for 1 date
		const today = new Date();
		const todayShort = today.toLocaleDateString();

		const ordersCollectionRef = collection(db, "biz", bizIdTemp, "orders");
		const q = query(
			ordersCollectionRef,
			where("shortDate", "==", todayShort),
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

			const currDateShort = date.toLocaleDateString();
			const localStorageDate = JSON.parse(getLocalStorage("currentDate"));

			// * Store currDate to localStorage to see if need to reload date.
			if (currDateShort !== localStorageDate) {
				setLocalStorage("currentDate", currDateShort);
			}

			date.setDate(date.getDate() + i);
			const weekDayIndex = date.getDay() + 1;
			let tempData = {};
			tempData.shortDate = currDateShort;
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

	// * Actions ---------------------------------------------------------------
	async function handleCreateNow(e) {
		setFlashScheduleLoading(true);

		const numHoursInt = parseInt(numMins);
		const numAvailInt = parseInt(numAvailable);
		let product = products.filter((item) => item.itemName === itemName).pop();

		const {
			id: productId,
			itemDescription,
			defaultPrice,
			originalPrice,
			allergens,
			itemImgLink,
			itemLrgImgLink,
		} = product;

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

		const itemPriceDoubleConvert = parseFloat(
			parseFloat(defaultPrice.slice(1)).toFixed(2)
		);

		const itemPricePennyConvert = itemPriceDoubleConvert * 100;
		const itemPricePennyInt = parseInt(itemPricePennyConvert);

		const date = new Date();
		const currShortDate = date.toLocaleDateString();
		const startTimeEpochMiliSec = Date.parse(date);
		let endTimeEpochMiliSec = numHoursInt * 60 * 1000 + startTimeEpochMiliSec;

		// console.log("startEpoch init", startTimeEpochMiliSec);
		// console.log("endEpoch init", endTimeEpochMiliSec);

		setScheduleNowValues((prev) => ({ ...prev, scheduleDate: currShortDate }));

		const dateStart = new Date(startTimeEpochMiliSec);
		const dateEnd = new Date(endTimeEpochMiliSec);
		const timeStart = dateStart.toLocaleTimeString("en-US", { hour12: false });
		const timeEnd = dateEnd.toLocaleTimeString("en-US", { hour12: false });
		let hourStart = parseInt(timeStart.split("").slice(0, 2).join(""));
		let minStart = parseInt(timeStart.split("").slice(3, 5).join(""));
		let hourEnd = parseInt(timeEnd.split("").slice(0, 2).join(""));
		let minEnd = parseInt(timeEnd.split("").slice(3, 5).join(""));

		const newDate = new Date();
		const todaysDate = new Date().toDateString();
		newDate.setDate(date.getDate() + 1);
		const tmwsDate = newDate.toDateString();

		if (hourStart === 24) {
			hourStart = 0;
		}

		if (0 <= minEnd && minEnd <= 15) {
			minEnd = 15;
		} else if (15 < minEnd && minEnd <= 30) {
			minEnd = 30;
		} else if (30 < minEnd && minEnd <= 45) {
			minEnd = 45;
		} else if (45 < minEnd && minEnd <= 59) {
			hourEnd += 1;
			minEnd = 0;
		}

		let today0 = Date.parse(todaysDate + " " + hourEnd + ":00:00");
		let today15 = Date.parse(todaysDate + " " + hourEnd + ":16:00");
		let today30 = Date.parse(todaysDate + " " + hourEnd + ":31:00");
		let today45 = Date.parse(todaysDate + " " + hourEnd + ":46:00");
		let today59 = Date.parse(todaysDate + " " + hourEnd + ":59:59");

		if (minEnd === 0) {
			today0 = Date.parse(todaysDate + " " + (hourEnd - 1) + ":00:00");
			today15 = Date.parse(todaysDate + " " + (hourEnd - 1) + ":16:00");
			today30 = Date.parse(todaysDate + " " + (hourEnd - 1) + ":31:00");
			today45 = Date.parse(todaysDate + " " + (hourEnd - 1) + ":46:00");
			today59 = Date.parse(todaysDate + " " + (hourEnd - 1) + ":59:59");
		}

		if (hourEnd === 0 && minEnd === 0) {
			today0 = Date.parse(tmwsDate + " " + hourEnd + ":00:00");
			today15 = Date.parse(tmwsDate + " " + hourEnd + ":16:00");
			today30 = Date.parse(tmwsDate + " " + hourEnd + ":31:00");
			today45 = Date.parse(tmwsDate + " " + hourEnd + ":46:00");
			today59 = Date.parse(tmwsDate + " " + hourEnd + ":59:59");
		}

		// * Update times
		const update0 = Date.parse(todaysDate + " " + hourEnd + ":00:00");
		const update15 = Date.parse(todaysDate + " " + hourEnd + ":15:00");
		const update30 = Date.parse(todaysDate + " " + hourEnd + ":30:00");
		const update45 = Date.parse(todaysDate + " " + hourEnd + ":45:00");
		const update59 = Date.parse(todaysDate + " " + hourEnd + ":59:59");

		if (today0 <= endTimeEpochMiliSec && endTimeEpochMiliSec <= today15) {
			endTimeEpochMiliSec = update15;
		} else if (
			today15 < endTimeEpochMiliSec &&
			endTimeEpochMiliSec <= today30
		) {
			endTimeEpochMiliSec = update30;
		} else if (
			today30 < endTimeEpochMiliSec &&
			endTimeEpochMiliSec <= today45
		) {
			endTimeEpochMiliSec = update45;
		} else if (
			today45 < endTimeEpochMiliSec &&
			endTimeEpochMiliSec <= today59
		) {
			let todayRollOverAm;
			if (hourEnd === 24) {
				todayRollOverAm = Date.parse(tmwsDate + " " + "00:00:00");
			} else {
				const hourPlus = hourEnd + 1;
				// console.log("hourPlus", hourPlus);
				todayRollOverAm = Date.parse(todaysDate + " " + hourEnd + ":00:00");
			}
			endTimeEpochMiliSec = todayRollOverAm;
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
			productId,
			itemName,
			itemDescription,
			originalPrice,
			allergens,
			itemImgLink: itemImgLink ? itemImgLink : "",
			itemLrgImgLink: itemLrgImgLink ? itemLrgImgLink : "",
			itemPrice: defaultPrice,
			itemPriceDouble: itemPriceDoubleConvert,
			itemPricePenny: itemPricePennyInt,
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

		// setFlashScheduleLoading(false);
		// console.log(flashScheduledData);

		const resFlashSchedule = await createFlashSchedule(
			bizId,
			dayIndex,
			flashScheduledData,
			endTimeEpochMiliSec,
			currShortDate,
			defaultPrice,
			itemName,
			emoji,
			originalPrice
		);

		if (resFlashSchedule.success) {
			setFlashScheduleLoading(false);
			setScheduleNowValues((prev) => ({
				...prev,
				showScheduleModal: false,
				numAvailable: "1",
				numMins: "60",
				showScheduleNowAlert: false,
				loading: false,
				itemName: defaultItemName,
			}));
		} else {
			setFlashScheduleLoading(false);
			setScheduleNowValues((prev) => ({
				...prev,
				loading: false,
				scheduleNowMessage: resFlashSchedule.message,
				showScheduleNowAlert: true,
				numAvailable: "1",
				numMins: "60",
				itemName: defaultItemName,
			}));
		}
	}

	function handleFlashChange(e) {
		const { name, value } = e.target;

		console.log(value);

		setScheduleNowValues((prev) => ({
			...prev,
			[name]: value,
			showScheduleNowAlert: false,
		}));
	}

	function handleScheduleNow(e) {
		const date = new Date();
		const currHour = date.getHours();
		const currMin = date.getMinutes();

		let disable1Hr = false;
		let disable2Hr = false;
		let disable30 = false;
		let disable15 = false;

		if (currHour === 22) {
			if (currMin >= 0) {
				disable2Hr = true;
			}
		}

		if (currHour === 23) {
			disable2Hr = true;
			if (currMin >= 0) {
				disable1Hr = true;
			}
			if (currMin >= 30) {
				disable30 = true;
			}
			if (currMin >= 45) {
				disable15 = true;
			}
		}

		if (disable1Hr) {
			setScheduleNowValues((prev) => ({
				...prev,
				numMins: "30",
			}));
		}

		if (disable30) {
			setScheduleNowValues((prev) => ({
				...prev,
				numMins: "15",
			}));
		}

		setScheduleNowValues((prev) => ({
			...prev,
			showScheduleModal: true,
		}));
	}

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	function handleSchedulesClick() {
		setOpenSchedule((prev) => !prev);
	}

	// * Displays ---------------------------------------------------------------
	function showScheduleNowModal() {
		const date = new Date();
		const currHour = date.getHours();
		const currMin = date.getMinutes();

		let disable1Hr = false;
		let disable2Hr = false;
		let disable30 = false;
		let disable15 = false;

		if (currHour === 22) {
			if (currMin >= 0) {
				disable2Hr = true;
			}
		}

		if (currHour === 23) {
			disable2Hr = true;
			if (currMin >= 0) {
				disable1Hr = true;
			}
			if (currMin >= 30) {
				// console.log("yes");
				disable30 = true;
			}
			if (currMin >= 45) {
				disable15 = true;
			}
		}

		return (
			<Modal
				open={showScheduleModal}
				onClose={() =>
					setScheduleNowValues((prev) => ({
						...prev,
						showScheduleModal: false,
						numAvailable: "1",
						numMins: "60",
						showScheduleNowAlert: false,
						itemName: defaultItemName,
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
					<div
						className={`${styles.ScheduleModal__container} ${styles.flexCol}`}
					>
						<div className={` ${styles.Schedule__meals}`}>
							<h3 className={`${styles.titleGap} ${styles.numMealGroup}`}>
								How many meals?
							</h3>
							{arrayOfTwenty.map((num, idx) => {
								return (
									<React.Fragment key={idx}>
										<input
											className={`${styles.radios}`}
											id={num}
											type="radio"
											checked={numAvailable === num}
											value={num}
											onChange={handleFlashChange}
											name="numAvailable"
											required
										/>
										<label
											htmlFor={num}
											className={`${styles.mealLabels} ${
												numAvailable === num ? styles.labelsChecked : undefined
											}`}
										>
											{num}
										</label>
									</React.Fragment>
								);
							})}
						</div>
						<div className={`${styles.Schedule__scheduleModal}`}>
							<div className={`${styles.flexRow} ${styles.hourTitleGroup}`}>
								<h3 className={`${styles.titleGap}`}>How many hours?</h3>
								<p className={`${styles.Description} ${styles.titleGap}`}>
									(12 am - 11:45 pm)
								</p>
							</div>
							<div className={`${styles.RadioGroup} ${styles.flexRow} `}>
								<input
									className={`${styles.radios}`}
									id="fifteen"
									type="radio"
									disabled={disable15}
									checked={numMins === "15"}
									value={15}
									onChange={handleFlashChange}
									name="numMins"
								/>
								<label
									htmlFor="fifteen"
									className={`${styles.labels} 
									 ${
											disable15
												? styles.hourDisabled
												: numMins === "15"
												? styles.labelsChecked
												: undefined
										}`}
								>
									15 m
								</label>
								<input
									className={`${styles.radios}`}
									id="thirty"
									type="radio"
									disabled={disable30}
									checked={numMins === "30"}
									value={30}
									onChange={handleFlashChange}
									name="numMins"
								/>
								<label
									htmlFor="thirty"
									className={`${styles.labels} 
									 ${
											disable30
												? styles.hourDisabled
												: numMins === "30"
												? styles.labelsChecked
												: undefined
										}`}
								>
									30 m
								</label>

								<input
									className={`${styles.radios}`}
									id="one"
									type="radio"
									disabled={disable1Hr}
									checked={numMins === "60"}
									value={60}
									onChange={handleFlashChange}
									name="numMins"
								/>
								<label
									htmlFor="one"
									className={`${styles.labels} 
									 ${
											disable1Hr
												? styles.hourDisabled
												: numMins === "60"
												? styles.labelsChecked
												: undefined
										}`}
								>
									1 hr
								</label>

								<input
									className={`${styles.radios}`}
									id="two"
									type="radio"
									disabled={disable2Hr}
									checked={numMins === "120"}
									value={120}
									onChange={handleFlashChange}
									name="numMins"
								/>
								<label
									htmlFor="two"
									className={`${styles.labels}  ${
										numMins === "120" ? styles.labelsChecked : undefined
									} ${disable2Hr ? styles.hourDisabled : undefined}`}
								>
									2 hr
								</label>
							</div>
						</div>
						<div className={`${styles.flexCol} ${styles.selectItemGroup}`}>
							<h3 className={`${styles.titleGap}`}>Select item:</h3>
							<div className={`${styles.flexRow} ${styles.itemGroup}`}>
								{products.map((product) => {
									return (
										<React.Fragment key={product.id}>
											<input
												className={`${styles.radios}`}
												id={product.id}
												checked={itemName === product.itemName}
												type="radio"
												name="itemName"
												value={product.itemName}
												onChange={handleFlashChange}
											/>
											<label
												htmlFor={product.id}
												className={`${styles.labels} ${
													itemName === product.itemName
														? styles.labelsChecked
														: undefined
												}`}
											>
												{product.itemName}
											</label>
										</React.Fragment>
									);
								})}
							</div>
						</div>
						{flashScheduleLoading ? (
							<CircularProgress />
						) : (
							<Button
								variant={"contained"}
								size="large"
								disabled={disable15}
								onClick={handleCreateNow}
								color={"primary"}
							>
								{"+ Create"}
							</Button>
						)}
					</div>
				</Box>
			</Modal>
		);
	}

	return (
		<Layout uid={uid} currentPage="Orders" subPage="incoming-orders">
			{openSchedule && (
				<RemoveSchedule
					bizId={bizId}
					open={openSchedule}
					close={handleSchedulesClick}
					schedules={schedules}
					timeDisplay={timeDisplay}
				/>
			)}
			{(ordersConfirmedLoading || ordersPendingLoading) && <CircularProgress />}
			{errorMessage && (
				<SuccessError
					handleOrderUpdate={handleScheduleUpdates}
					setHandleOrderUpdates={setHandleScheduleUpdates}
				/>
			)}
			<div className={styles.IncomingOrders__container}>
				{(scheduleNumAvail > 0 || pausedNumAvail > 0) && (
					<div className={`${styles.scheduleNumItemsLeft} ${styles.flexRow}`}>
						<Button
							onClick={handleSchedulesClick}
							variant="contained"
							color="secondary"
							size="large"
						>
							{scheduleNumAvail > 0 && `${scheduleNumAvail} left`}{" "}
							{scheduleNumAvail > 0 && pausedNumAvail > 0 && `- `}
							{pausedNumAvail > 0 && `${pausedNumAvail} paused`}
						</Button>
					</div>
				)}
				<Button variant="contained" onClick={handleScheduleNow}>
					⚡️ Flash Sale
				</Button>
				{showScheduleNowModal()}
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
						<OrdersComponent
							audio={audio}
							date={twoDates[0]}
							tab={0}
							uid={uid}
							bizId={bizId}
							pendingCount={pendingCount}
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
							audio={audio}
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
