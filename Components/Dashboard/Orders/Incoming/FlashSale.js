import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { Button, Grid } from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import styles from "../../../../styles/components/dashboard/orders/flashsale.module.css";
import {
	onSnapshot,
	doc,
	getDocs,
	collection,
	getDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase/fireConfig";
import { createFlashSchedule } from "../../../../actions/dashboard/scheduleCrud";

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

function FlashSale({ open, close, userData, loadUserData, bizIdArr }) {
	const [userArr, setUserArr] = useState([]);

	const [showSelectBiz, setShowSelectBiz] = useState(
		userData.length > 1 ? true : false
	);

	const [selectedBiz, setSelectedBiz] = useState({
		bizId: "",
		bizName: "",
		emoji: "",
		products: [],
	});

	const [flashScheduleValues, setFlashScheduleValues] = useState({
		loading: false,
		openAlert: false,
		errMsg: "",
		numAvailable: "1",
		numMins: "60",
		itemName: "",
	});

	const { bizId, bizName, emoji, products } = selectedBiz;

	const { loading, openAlert, errMsg, numAvailable, numMins, itemName } =
		flashScheduleValues;

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

	useEffect(() => {
		const numUsers = userData.length;

		if (numUsers === 1) {
			const user = userData.pop();
			handleSelectBiz(user);
		}

		setUserArr(userData);
	}, []);

	const handleSelectBiz = async (user) => {
		const bizId = user.bizId;
		const bizName = user.bizName;
		const emoji = user.emoji;

		const productsRef = collection(db, "biz", bizId, "products");

		const productSnap = await getDocs(productsRef);

		const productsArr = [];

		productSnap.forEach((doc) => {
			const productData = doc.data();
			productsArr.push(productData);
		});

		const defaultProduct = productsArr.filter((product) => product.isDefault)[0]
			.itemName;

		setShowSelectBiz(false);
		setSelectedBiz({
			emoji,
			bizId,
			bizName,
			products: productsArr,
		});
		setFlashScheduleValues((prev) => ({ ...prev, itemName: defaultProduct }));
	};

	const handleFlashChange = (e) => {
		const { name, value } = e.target;

		setFlashScheduleValues((prev) => ({
			...prev,
			[name]: value,
			openAlert: false,
		}));
	};

	const handleCreateNow = async () => {
		setFlashScheduleValues((prev) => ({ ...prev, loading: true }));

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

		const itemPriceDoubleConvert = parseFloat(
			parseFloat(defaultPrice.slice(1)).toFixed(2)
		);

		const itemPricePennyConvert = itemPriceDoubleConvert * 100;
		const itemPricePennyInt = parseInt(itemPricePennyConvert);

		const date = new Date();
		const currShortDate = date.toLocaleDateString();
		const startTimeEpochMiliSec = Date.parse(date);
		let endTimeEpochMiliSec = numHoursInt * 60 * 1000 + startTimeEpochMiliSec;

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
			loadUserData(bizIdArr);

			close();
		} else {
			setFlashScheduleValues((prev) => ({
				...prev,
				loading: false,
				openAlert: true,
				errMsg: resFlashSchedule.message,
			}));
		}
	};

	const showSelectBizModal = () => {
		return (
			<div className={`${styles.ScheduleModal__container} ${styles.flexCol}`}>
				<h2>Select business:</h2>

				{userData.map((user) => {
					return (
						<Button
							key={user.bizId}
							variant="contained"
							onClick={() => handleSelectBiz(user)}
						>
							{user.bizName}
						</Button>
					);
				})}
			</div>
		);
	};

	const showFlashScheduleModal = () => {
		const date = new Date();
		const currHour = date.getHours();
		const currMin = date.getMinutes();

		let disable15 = false;
		let disable30 = false;
		let disable1Hr = false;
		let disable2Hr = false;
		let disable3Hr = false;
		let disable4Hr = false;

		if (currHour >= 20) {
			if (currMin >= 0) {
				disable4Hr = true;
			}
		}

		if (currHour >= 21) {
			if (currMin >= 0) {
				disable3Hr = true;
			}
		}

		if (currHour >= 22) {
			if (currMin >= 0) {
				disable2Hr = true;
			}
		}

		if (currHour >= 23) {
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

		return (
			<div className={`${styles.ScheduleModal__container} ${styles.flexCol}`}>
				<div className={` ${styles.Schedule__meals}`}>
					<h2 className={`${styles.BizName}`}>{bizName}</h2>
					{errMsg !== "" && showError()}
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
					<div
						className={`${styles.RadioGroup} ${styles.flexRow} ${styles.itemGroup}`}
					>
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
							className={`${styles.labels}  ${
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
							className={`${styles.labels} ${
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
						<input
							className={`${styles.radios}`}
							id="three"
							type="radio"
							disabled={disable3Hr}
							checked={numMins === "180"}
							value={180}
							onChange={handleFlashChange}
							name="numMins"
						/>
						<label
							htmlFor="three"
							className={`${styles.labels}  ${
								numMins === "180" ? styles.labelsChecked : undefined
							} ${disable3Hr ? styles.hourDisabled : undefined}`}
						>
							3 hr
						</label>
						<input
							className={`${styles.radios}`}
							id="four"
							type="radio"
							disabled={disable4Hr}
							checked={numMins === "240"}
							value={240}
							onChange={handleFlashChange}
							name="numMins"
						/>
						<label
							htmlFor="four"
							className={`${styles.labels}  ${
								numMins === "240" ? styles.labelsChecked : undefined
							} ${disable4Hr ? styles.hourDisabled : undefined}`}
						>
							4 hr
						</label>
					</div>
				</div>
				<div className={`${styles.flexCol} ${styles.selectItemGroup}`}>
					<h3 className={`${styles.titleGap}`}>Select item(s):</h3>
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
				{loading ? (
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
		);
	};

	const showError = () => {
		return (
			<Grid item xs={12} md={12} mb={2}>
				<Collapse in={openAlert}>
					<Alert
						severity={"error"}
						onClose={() => {
							setFlashScheduleValues((prev) => ({ ...prev, openAlert: false }));
						}}
					>
						{errMsg}
					</Alert>
				</Collapse>
			</Grid>
		);
	};

	return (
		<Modal
			open={open}
			onClose={() => {
				loadUserData(bizIdArr);
				close();
			}}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={style}>
				{showSelectBiz ? showSelectBizModal() : showFlashScheduleModal()}
			</Box>
		</Modal>
	);
}

export default FlashSale;
