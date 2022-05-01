import React, { useState, useEffect } from "react";
import DayComponent from "../../../Components/Dashboard/Schedule/DayComponent";
import Layout from "../../../Components/Layout";
import styles from "../../../styles/pages/dashboard/schedule.module.css";
import { getBiz } from "../../../actions/crud/bizUser";
import { useRouter } from "next/router";
import { getLocalStorage, setLocalStorage } from "../../../actions/auth/auth";
import { Button, CircularProgress, Grid } from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { createFlashSchedule } from "../../../actions/dashboard/scheduleCrud";
import {
	collection,
	query,
	onSnapshot,
	where,
	getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";
import SuccessError from "../../../Components/Dashboard/Orders/SuccessError";
import getProducts from "../../../actions/dashboard/productsCrud";

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

function Schedule() {
	const [defaultItemName, setDefaultItemName] = useState("");
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
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [sevenDays, setSevenDays] = useState([
		{
			month: "",
			monthDay: "",
			dayOfWeek: "",
			dayOfWkIdx: 0,
			actualDate: "",
			shortDate: "",
			// currEpoch: 0,
		},
	]);
	const [userDataValues, setUserDataValues] = useState({
		loading: false,
		userData: [],
		message: "",
		ordersDataArr: [],
		emoji,
	});

	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
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
	const { month, actualDate, shortDate, dayOfWeek, dayOfWkIdx } = sevenDays;
	const { loading, userData, message, ordersDataArr, emoji } = userDataValues;
	const { storedUser, bizId } = user;
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

		if (!bizIdTemp) {
			return;
		}

		loadDates();
		loadProducts(bizIdTemp);
		loadUserData(bizIdTemp);

		return () => {
			document.removeEventListener("visibilitychange", onPageChangeVisibility);
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// * UseEffect ACTIONS -----------------------------

	async function onPageChangeVisibility() {
		const date = new Date();
		const currShortDate = date.toLocaleDateString();
		const localStorageDate = JSON.parse(getLocalStorage("currentDate"));

		if (
			currShortDate === localStorageDate &&
			document.visibilityState === "visible"
		) {
			// console.log("load dates");
			loadDates();
		}
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
			const emoji = resUserData.emoji;
			const ordersArr = resUser.ordersArr;

			setUserDataValues((prev) => ({
				...prev,
				userData: resUserData,
				loading: false,
				message: "",
				ordersDataArr: ordersArr,
				emoji: emoji,
			}));
		} else {
			setUserDataValues((prev) => ({
				...prev,
				loading: false,
				message: resUser.message,
			}));
		}
	}
	console.log("emoji", emoji);
	// console.log(sevenDays);
	function loadDates() {
		const datesArray = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date();

			const currDateShort = date.toLocaleDateString();
			const localStorageDate = JSON.parse(getLocalStorage("currentDate"));
			// console.log(currDateShort, localStorageDate);

			// * Store currDate to localStorage to see if need to reload date.
			if (currDateShort !== localStorageDate) {
				// console.log(localStorageDate);
				setLocalStorage("currentDate", currDateShort);
			}

			date.setDate(date.getDate() + i);
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const dateConcat = month + "-" + day;
			const dayOfWk = date.getDay();
			let tempData = {};
			tempData.monthDay = dateConcat;
			tempData.actualDate = date.toDateString();
			tempData.dayOfWkIdx = dayOfWk + 1;
			tempData.shortDate = date.toLocaleDateString();
			tempData.month = month;
			// tempData.currEpoch = Date.parse(date);

			switch (dayOfWk) {
				case 0:
					tempData.dayOfWeek = "Sun";
					break;
				case 1:
					tempData.dayOfWeek = "Mon";
					break;
				case 2:
					tempData.dayOfWeek = "Tue";
					break;
				case 3:
					tempData.dayOfWeek = "Wed";
					break;
				case 4:
					tempData.dayOfWeek = "Thur";
					break;
				case 5:
					tempData.dayOfWeek = "Fri";
					break;
				case 6:
					tempData.dayOfWeek = "Sat";
					break;

				default:
					break;
			}

			datesArray.push(tempData);
		}

		setSevenDays(datesArray);
	}

	// * ACTIONS ------------------------------------

	function handleFlashChange(e) {
		const { name, value } = e.target;

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

	async function handleCreateNow(e) {
		setFlashScheduleLoading(true);

		// * If numAvail === 20, make it back to 10 because 10 is max
		let resetNumTo10;
		if (numAvailable === "20") {
			resetNumTo10 = "10";
		} else {
			resetNumTo10 = numAvailable;
		}

		const numHoursInt = parseInt(numMins);
		const numAvailInt = parseInt(resetNumTo10);
		let product = products.filter((item) => item.itemName === itemName).pop();
		const { itemDescription, defaultPrice, originalPrice, allergens } = product;

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

		// console.log("timeStart", timeStart);
		// console.log("timeEnd", timeEnd);
		// console.log("hourStart", hourStart);
		// console.log("minStart", minStart);
		// console.log("hourEnd", hourEnd);
		// console.log("minEnd", minEnd);

		const newDate = new Date();
		const todaysDate = new Date().toDateString();
		newDate.setDate(date.getDate() + 1);
		const tmwsDate = newDate.toDateString();

		// console.log("today Date", todaysDate);
		// console.log("tmw Date", tmwsDate);

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

		// if (hourEnd === 24) {
		// 	hourEnd = 0;
		// } else if (hourEnd === 25) {
		// 	hourEnd = 1;
		// } else if (hourEnd === 26) {
		// 	hourEnd = 2;
		// }

		// console.log("new hourEnd", hourEnd);
		// console.log("new minEnd", minEnd);

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

		// console.log("today0", today0);
		// console.log("today15", today15);
		// console.log("today30", today30);
		// console.log("today45", today45);
		// console.log("today59", today59);

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

		// console.log("new End Time", endTimeEpochMiliSec);

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
			originalPrice,
			allergens,
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
			emoji
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

	// * Displays -----------------------------------

	function showScheduleLegend() {
		return (
			<React.Fragment>
				{(errorMessage || successMessage) && (
					<SuccessError
						handleOrderUpdate={handleScheduleUpdates}
						setHandleOrderUpdates={setHandleScheduleUpdates}
					/>
				)}
				<div className={styles.DashHeader__schedulePage}>
					<div>
						<h4 style={{ color: "var(--flash)" }}>
							<span>• </span>
							<span>Flash</span>
						</h4>
					</div>
					<div>
						<h4 style={{ color: "var(--light-green)" }}>
							<span>• </span>
							<span>Live</span>
						</h4>
					</div>
					<div>
						<h4 style={{ color: "var(--orange)" }}>
							<span>• </span>
							<span>Orders</span>
						</h4>
					</div>
					<div>
						<h4 style={{ color: "var(--gray)" }}>
							<span>• </span>
							<span>Sold out</span>
						</h4>
					</div>
				</div>
			</React.Fragment>
		);
	}

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
									className={`${styles.labels} 			 ${
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
		<Layout currentPage="Schedule" uid={uid}>
			{showScheduleNowModal()}
			<div className={styles.Schedule}>
				<div className={styles.Schedule__header}>
					<p
						style={{
							color: "var(--gray)",
						}}
					>
						* Place all schedules before{" "}
						<u>
							<b>11pm</b>
						</u>
						.
					</p>
					{showScheduleLegend()}
					<Button variant="contained" onClick={handleScheduleNow}>
						⚡️ Flash Sale
					</Button>
				</div>
				<div className={styles.Schedule__container}>
					{sevenDays.map((date, i) => (
						<DayComponent
							bizName={storedUser.bizName}
							bizId={bizId}
							uid={uid}
							date={date}
							key={i}
							userData={userData}
							ordersDataArr={ordersDataArr}
						/>
					))}
				</div>
			</div>
		</Layout>
	);
}

export default Schedule;
