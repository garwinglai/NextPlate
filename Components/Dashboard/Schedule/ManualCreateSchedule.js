import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import styles from "../../../styles/components/dashboard/schedule/manualcreateschedule.module.css";
import getProducts from "../../../actions/dashboard/productsCrud";
import { CircularProgress } from "@mui/material";
import TextField from "@mui/material/TextField";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import Stack from "@mui/material/Stack";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import TimePicker from "@mui/lab/TimePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { createNewSchedule } from "../../../actions/dashboard/scheduleCrud";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function ManualCreateSchedule({
	open,
	close,
	uid,
	date,
	bizId,
	userData,
	emoji,
}) {
	const [values, setValues] = useState({
		itemName: "",
		numAvailable: "1",
		startTime: new Date(),
		endTime: new Date(),
		recurringWeekly: false,
		recurringDaily: false,
		scheduledDate: date.actualDate,
		scheduledDateShort: date.shortDate,
		products: [],
		defaultItemName: "",
		loading: false,
		errorMessage: "",
		openAlert: false,
	});

	const {
		itemName,
		numAvailable,
		startTime,
		endTime,
		recurringWeekly,
		recurringDaily,
		scheduledDate,
		scheduledDateShort,
		products,
		defaultItemName,
		loading,
		errorMessage,
		openAlert,
	} = values;
	const { monthDay, dayOfWeek, actualDate, shortDate, dayOfWkIdx } = date;
	const arrayOfTwenty = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

	useEffect(() => {
		loadProducts(bizId);
	}, [bizId]);

	async function loadProducts(bizId) {
		const productRes = await getProducts(bizId);
		const { success, message, productsArr } = productRes;
		if (success) {
			const isDefaultItemName = productsArr.filter((item) => item.isDefault)[0]
				.itemName;
			setValues((prev) => ({
				...prev,
				products: productsArr,
				itemName: isDefaultItemName,
				defaultItemName: isDefaultItemName,
			}));
		} else {
			// TODO: handleError
			console.log("loadProducts", message);
		}
	}

	function handleScheduleChange(e, time) {
		if (time === "startTime" || time === "endTime") {
			// * Save Epoch Time
			const newTime = e;

			if (time === "startTime") {
				setValues((prev) => ({ ...prev, startTime: newTime }));
			}

			if (time === "endTime") {
				setValues((prev) => ({ ...prev, endTime: newTime }));
			}
		} else {
			const { name, value, checked, type } = e.target;
			// console.log(type, checked, value, name);
			const newValue = type === "checkbox" ? checked : value;

			setValues((prev) => ({
				...prev,
				[name]: newValue,
			}));
		}
	}

	async function handleCreateNow() {
		if (!startTime || !endTime) {
			setValues((prev) => ({
				...prev,
				loading: false,
				errorMessage: "Please select a start and end time.",
				openAlert: true,
			}));
			return;
		}

		setValues((prev) => ({ ...prev, loading: true }));
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

		const today = new Date();

		const dateStart = new Date(startTime);
		const dateEnd = new Date(endTime);
		const timeStart = dateStart.toLocaleTimeString("en-US", { hour12: false });
		const timeEnd = dateEnd.toLocaleTimeString("en-US", { hour12: false });

		const itemPriceNoDollarSign = defaultPrice.slice(1);
		const itemPriceDoubleConvert = parseFloat(itemPriceNoDollarSign);
		const itemPricePennyConvert = itemPriceDoubleConvert * 100;

		const startTimeEpochMiliSec = Date.parse(actualDate + " " + timeStart);
		const endTimeEpochMiliSec = Date.parse(actualDate + " " + timeEnd);
		const startTimeString = new Date(startTimeEpochMiliSec).toLocaleTimeString(
			"en-US",
			{ hour: "numeric", minute: "numeric", hour12: true }
		);
		const endTimeString = new Date(endTimeEpochMiliSec).toLocaleTimeString(
			"en-US",
			{ hour: "numeric", minute: "numeric", hour12: true }
		);

		// console.log(startTimeString, endTimeString);

		if (endTimeString === "Invalid Date") {
			setValues((prev) => ({
				...prev,
				loading: false,
				openAlert: true,
				errorMessage: "Invalid date. (12 am - 11:45 pm)",
			}));
			return;
		}

		const recurring = recurringWeekly ? true : recurringDaily ? true : false;

		const timeDisplay = startTimeString + " - " + endTimeString;
		const hourStart = parseInt(timeStart.split("").slice(0, 2).join(""));
		const minStart = parseInt(timeStart.split("").slice(3, 5).join(""));
		const hourEnd = parseInt(timeEnd.split("").slice(0, 2).join(""));
		const minEnd = parseInt(timeEnd.split("").slice(3, 5).join(""));
		// console.log(timeDisplay);
		const scheduleData = {
			productId,
			itemName,
			itemDescription,
			originalPrice,
			itemImgLink: itemImgLink ? itemImgLink : "",
			itemLrgImgLink: itemLrgImgLink ? itemLrgImgLink : "",
			itemPrice: defaultPrice,
			itemPriceDouble: itemPriceDoubleConvert,
			itemPricePenny: itemPricePennyConvert,
			numAvailable: parseInt(numAvailable),
			numAvailableStart: parseInt(numAvailable),
			startTime: startTimeEpochMiliSec,
			endTime: endTimeEpochMiliSec,
			timeDisplay,
			hourStart,
			minStart,
			hourEnd,
			minEnd,
			recurring,
			recurringDaily,
			scheduledDate,
			scheduledDateShort,
			dayOfWeek,
			dayOfWkIdx,
			status: "Regular",
			statusIndex: 0,
		};

		// setValues((prev) => ({ ...prev, loading: false }));
		// console.log(scheduleData);

		const { success, message } = await createNewSchedule(
			bizId,
			scheduleData,
			dayOfWeek,
			hourStart,
			minStart,
			hourEnd,
			minEnd,
			actualDate,
			date.shortDate,
			defaultPrice,
			itemName,
			emoji
		);

		if (success) {
			setValues((prev) => ({
				...prev,
				loading: false,
				startTime: new Date(),
				endTime: new Date(),
				openAlert: false,
				errorMessage: "",
			}));
			close();
		} else {
			setValues((prev) => ({
				...prev,
				loading: false,
				errorMessage: message,
				openAlert: true,
			}));
		}
	}

	return (
		<React.Fragment>
			<Modal
				open={open}
				onClose={() => {
					close();
					setValues((prev) => ({
						...prev,
						startTime: new Date(),
						endTime: new Date(),
						itemName: defaultItemName,
						numAvailable: "1",
						recurringWeekly: false,
						recurringDaily: false,
						errorMessage: "",
						openAlert: false,
					}));
				}}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
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
											onChange={handleScheduleChange}
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
												onChange={handleScheduleChange}
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
						<div className={`${styles.flexCol}`}>
							<div
								className={`${styles.flexRow} ${styles.titleGap} ${styles.timeTitle}`}
							>
								<h3>Choose time:</h3>
								<p>(15m intervals)</p>
							</div>
							<div className={`${styles.flexCol} ${styles.timeGroup}`}>
								<div className={`${styles.time}`}>
									<LocalizationProvider dateAdapter={AdapterDateFns}>
										<MobileTimePicker
											label="Start time"
											required
											value={startTime}
											minutesStep={15}
											onChange={(value) =>
												handleScheduleChange(value, "startTime")
											}
											renderInput={(params) => <TextField {...params} />}
										/>
									</LocalizationProvider>
								</div>
								<div className={`${styles.time}`}>
									<LocalizationProvider dateAdapter={AdapterDateFns}>
										<MobileTimePicker
											label="End time"
											required
											value={endTime}
											minutesStep={15}
											onChange={(value) =>
												handleScheduleChange(value, "endTime")
											}
											renderInput={(params) => <TextField {...params} />}
										/>
									</LocalizationProvider>
								</div>
							</div>
						</div>

						<div className={`${styles.flexRow} ${styles.CheckBox__container}`}>
							<div
								className={`${styles.Form__bottomCheckbox} ${styles.flexRow}`}
							>
								<input
									type="checkbox"
									id="recurringWeekly"
									name="recurringWeekly"
									value={recurringWeekly}
									onChange={handleScheduleChange}
								/>
								<label
									htmlFor="recurringWeekly"
									className={`${styles.recurringLabel}`}
								>
									Weekly
								</label>
							</div>

							{/* <div
								className={`${styles.Form__bottomCheckbox} ${styles.flexRow}`}
							>
								<input
									type="checkbox"
									id="recurringDaily"
									name="recurringDaily"
									value={recurringDaily}
									onChange={handleScheduleChange}
								/>
								<label
									htmlFor="recurringDaily"
									className={`${styles.recurringLabel}`}
								>
									Daily
								</label>
							</div> */}
						</div>
						{loading ? (
							<CircularProgress />
						) : (
							<div className={`${styles.footer} ${styles.flexCol}`}>
								<Collapse in={openAlert}>
									<Alert
										sx={{ marginBottom: openAlert ? "20px" : "0" }}
										severity="error"
										onClose={() => {
											setValues((prev) => ({
												...prev,
												openAlert: false,
												errorMessage: "",
											}));
										}}
									>
										{errorMessage}
									</Alert>
								</Collapse>
								<Button
									variant={"contained"}
									size="large"
									onClick={handleCreateNow}
									color={"primary"}
								>
									{"+ Create"}
								</Button>
							</div>
						)}
					</div>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default ManualCreateSchedule;
