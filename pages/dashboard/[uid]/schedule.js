import React, { useState, useEffect } from "react";
import DayComponent from "../../../Components/Dashboard/Schedule/DayComponent";
import Layout from "../../../Components/Layout";
import styles from "../../../styles/pages/dashboard/schedule.module.css";
import { getBiz } from "../../../actions/crud/bizUser";
import { useRouter } from "next/router";
import { getLocalStorage } from "../../../actions/auth/auth";
import { Button, Grid } from "@mui/material";
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

function Schedule() {
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
		},
	]);
	const [userDataValues, setUserDataValues] = useState({
		loading: false,
		userData: [],
		message: "",
		ordersDataArr: [],
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
		numHours,
	} = scheduleNowValues;
	const { month, actualDate, shortDate, dayOfWeek, dayOfWkIdx } = sevenDays;
	const { loading, userData, message, ordersDataArr } = userDataValues;
	const { storedUser, bizId } = user;

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
		const unsubscribeFlash = getFlashSchedules(bizIdTemp);

		return () => {
			unsubscribeFlash();
		};
	}, [uid]);

	// * UseEffect ACTIONS -----------------------------
	function getFlashSchedules(bizId) {
		const openHistoryRef = collection(db, "biz", bizId, "openHistory");

		const date = new Date();
		const shortDate = date.toLocaleDateString();
		const currEpochTime = Date.parse(date);

		const q = query(
			openHistoryRef,
			where("scheduledDateShort", "==", shortDate),
			where("recurring", "==", false),
			where("status", "==", "Flash")
			// where("flashEnds", ">=", currEpochTime)
		);

		const unsubscribeFlash = onSnapshot(
			q,
			(querySnapshot) => {
				const schedArr = [];

				querySnapshot.forEach((doc) => {
					const data = doc.data();
					schedArr.push(data);
				});

				const timeDisplayArr = [];
				const tempTimeDisplayArr = [];

				if (schedArr.length > 0) {
					for (let i = 0; i < schedArr.length; i++) {
						const curr = schedArr[i];
						const timeObj = {
							startTime: curr.startTime,
							timeDisplay: curr.timeDisplay,
							hourStart: curr.hourStart,
							minStart: curr.minStart,
						};
						if (!tempTimeDisplayArr.includes(curr.timeDisplay)) {
							timeDisplayArr.push(timeObj);
							tempTimeDisplayArr.push(curr.timeDisplay);
						}
					}

					setFlash((prev) => ({
						...prev,
						postsFlash: schedArr,
						timeDisplaysFlash: timeDisplayArr,
						hasFlashOnDateComponent: true,
						currShortDate: shortDate,
					}));
				} else {
					setFlash((prev) => ({
						...prev,
						postsFlash: [],
						timeDisplaysFlash: [],
						hasFlashOnDateComponent: false,
						currShortDate: "",
					}));
				}
			},
			(error) => {
				setFlash((prev) => ({
					...prev,
					hasFlashOnDateComponent: false,
					errorLoadingFlash: `Error fetching flash posts: ${error}`,
				}));
			}
		);

		return unsubscribeFlash;
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

	function loadDates() {
		const datesArray = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date();
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

	function handleChange(e) {
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
						<h4 style={{ color: "var(--light-red)" }}>
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
								onChange={handleChange}
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
										onChange={handleChange}
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
										onChange={handleChange}
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
						* Posts are live <u>today</u> and <u>tomorrow</u>.
					</p>
					{showScheduleLegend()}
					<Button variant="contained" onClick={handleScheduleNow}>
						⚡️ Flash Sale
					</Button>
				</div>
				<div className={styles.Schedule__container}>
					{sevenDays.map((date, i) => (
						<DayComponent
							flash={flash}
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
