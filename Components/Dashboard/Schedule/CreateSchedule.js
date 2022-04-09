import React, { useState, useRef, useLayoutEffect } from "react";
import styles from "../../../styles/components/dashboard/schedule/createschedule.module.css";
import CurrencyInput from "react-currency-input-field";
import { createNewSchedule } from "../../../actions/dashboard/scheduleCrud";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { ClickAwayListener, Button, Avatar } from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import TextField from "@mui/material/TextField";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import Stack from "@mui/material/Stack";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import TimePicker from "@mui/lab/TimePicker";
import MobileTimePicker from "@mui/lab/MobileTimePicker";
import DesktopTimePicker from "@mui/lab/DesktopTimePicker";

function CreateSchedule({ uid, onClose, date, bizId, userData }) {
	// const [values, setValues] = useState({
	// 	itemName: userData.itemName,
	// 	itemDescription: userData.itemDescription,
	// 	itemPrice: userData.defaultPrice.slice(1),
	// 	numAvailable: 1,
	// 	startTime: "",
	// 	endTime: "",
	// 	originalPrice: userData.originalPrice.slice(1),
	// 	allergens: userData.allergens,
	// 	recurring: false,
	// 	scheduledDate: date.actualDate,
	// 	scheduledDateShort: date.shortDate,
	// });

	const [values, setValues] = useState({
		itemName: "",
		itemDescription: "",
		itemPrice: "",
		numAvailable: 1,
		startTime: "",
		endTime: "",
		originalPrice: "",
		allergens: "",
		recurring: false,
		scheduledDate: date.actualDate,
		scheduledDateShort: date.shortDate,
	});

	const [successMessage, setSuccessMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [saveError, setSaveError] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const {
		itemName,
		itemDescription,
		itemPrice,
		numAvailable,
		startTime,
		endTime,
		originalPrice,
		allergens,
		recurring,
		scheduledDate,
		scheduledDateShort,
	} = values;

	const { monthDay, dayOfWeek, actualDate, shortDate, dayOfWkIdx } = date;

	const alertRef = useRef(null);

	useLayoutEffect(() => {
		alertRef.current.scrollIntoView();
	}, []);

	// * ACTIONS -----------------------------------------
	async function handleFormSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setSaveError(false);
		setSaveSuccess(false);
		setSuccessMessage("");

		if (
			startTime === "" ||
			startTime === "Invalid Date" ||
			endTime === "" ||
			endTime === "Invalid Date"
		) {
			setLoading(false);
			setSaveError(true);
			setSuccessMessage(
				"Invalid time. Check spacing or use clock icon to set time."
			);
			alertRef.current.scrollIntoView();
			return;
		}

		const dateStart = new Date(startTime);
		const dateEnd = new Date(endTime);
		const timeStart = dateStart.toLocaleTimeString("en-US", { hour12: false });
		const timeEnd = dateEnd.toLocaleTimeString("en-US", { hour12: false });

		const itemPriceWithDollarSign = "$" + itemPrice;
		const itemPriceDoubleConvert = parseFloat(itemPrice);
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

		const timeDisplay = startTimeString + " - " + endTimeString;
		const hourStart = parseInt(timeStart.split("").slice(0, 2).join(""));
		const minStart = parseInt(timeStart.split("").slice(3, 5).join(""));
		const hourEnd = parseInt(timeEnd.split("").slice(0, 2).join(""));
		const minEnd = parseInt(timeEnd.split("").slice(3, 5).join(""));

		const oneHourEpoch = 60 * 60 * 1000;

		if (!endTimeEpochMiliSec) {
			setSuccessMessage("Please enter a valid time. (12 am - 11:45 pm)");
			setSaveError(true);
			setLoading(false);
			alertRef.current.scrollIntoView();
			return;
		}

		if (endTimeEpochMiliSec - startTimeEpochMiliSec < oneHourEpoch) {
			setSuccessMessage("Please provide at least 1 hour timeframe.");
			setSaveError(true);
			setLoading(false);
			alertRef.current.scrollIntoView();
			return;
		}

		if (itemPrice[0] === "1" && itemPrice[1] === ".") {
			setLoading(false);
			setSaveError(true);
			setSuccessMessage("Item price must be a minimum of $2.00");
			return;
		}

		const scheduleData = {
			itemName,
			itemDescription,
			originalPrice: "$" + originalPrice,
			allergens,
			itemPrice: itemPriceWithDollarSign,
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
			scheduledDate,
			scheduledDateShort,
			dayOfWeek,
			dayOfWkIdx,
			status: "Regular",
			statusIndex: 0,
		};

		const { success, message } = await createNewSchedule(
			bizId,
			scheduleData,
			dayOfWeek,
			hourStart,
			minStart,
			hourEnd,
			minEnd,
			actualDate,
			date.shortDate
		);
		if (success) {
			setLoading(false);
			setSaveError(false);
			setSaveSuccess(true);
			setSuccessMessage(message);
			alertRef.current.scrollIntoView();
		} else {
			setLoading(false);
			setSaveError(true);
			setSuccessMessage(message);
			alertRef.current.scrollIntoView();
		}
	}

	function handleChange(e) {
		const target = e.target;
		const name = target.name;
		const value = target.type === "checkbox" ? target.checked : target.value;

		setValues((prev) => ({ ...prev, [name]: value }));
	}

	return (
		<div className={styles.CreateSchedule}>
			<div className={styles.CreateSchedule__container}>
				<p ref={alertRef} style={{ visibility: "hidden" }}>
					hi
				</p>
				<div className={styles.CreateSchedule__errorMessage}>
					<Button
						variant="outlined"
						color="error"
						onClick={onClose}
						type="button"
						size="small"
					>
						Close
					</Button>
					{saveError && (
						<Alert severity="error" sx={{ marginBottom: "5px" }}>
							{successMessage}
						</Alert>
					)}
					{saveSuccess && (
						<Alert severity="success" sx={{ marginBottom: "5px" }}>
							{successMessage}
						</Alert>
					)}
				</div>
				<form
					onSubmit={handleFormSubmit}
					className={styles.CreateSchedule__form}
				>
					<div className={styles.CreateSchedule__header}>
						<h2>Create new post</h2>
						<p className={styles.CreateSchedule__date}>
							Date: {monthDay} {dayOfWeek}
						</p>
					</div>
					<div className={styles.CreateSchedule__bodyContainer}>
						<div className={styles.CreateSchedule__formDefaults}>
							<h3>Item information:</h3>
							<div>
								<div className={styles.CreateSchedule__formDefaultsInfo}>
									<label htmlFor="itemName">* Item name</label>
									<input
										required
										id="itemName"
										type="text"
										value={itemName}
										name="itemName"
										onChange={handleChange}
										// style={{ color: "var(--gray)" }}
									/>
								</div>
								<div className={styles.CreateSchedule__formDefaultsInfo}>
									<label htmlFor="itemDescription">* Item description</label>
									<textarea
										required
										id="itemDescription"
										name="itemDescription"
										type="text"
										maxLength={350}
										rows="3"
										value={itemDescription}
										onChange={handleChange}
									/>
								</div>
								<div className={styles.CreateSchedule__formDefaultsInfo}>
									<label htmlFor="allergens">Allergens</label>
									<label
										style={{
											fontSize: "12px",
											opacity: "0.6",
											margin: "5px 0",
										}}
									>
										Please type as you would like it to be shown.
									</label>
									<textarea
										id="allergens"
										name="allergens"
										type="text"
										maxLength={350}
										rows="2"
										value={allergens}
										onChange={handleChange}
									/>
								</div>
							</div>
							<p className={styles.CreateSchedule__info}>
								*** To edit item information navigate to{` `}
								<Link href={`/dashboard/${uid}/account`}>
									<a>
										<u>
											<b style={{ color: "var(--btn-blue)" }}>account</b>
										</u>
									</a>
								</Link>
								{` `}
								page.
							</p>
						</div>

						<div className={styles.CreateSchedule__formDefaults}>
							<div>
								<h3>Item values:</h3>
								<div className={styles.CreateSchedule__formQuantities}>
									<label htmlFor="originalPrice">* Original price</label>
									<CurrencyInput
										className={styles.CreateSchedule__currentInput}
										autoFocus
										id="originalPrice"
										name="originalPrice"
										value={originalPrice}
										prefix="$"
										required
										decimalScale={2}
										decimalsLimit={2}
										onValueChange={(value, name) =>
											setValues((prev) => ({ ...prev, [name]: value }))
										}
									/>
									<label htmlFor="itemPrice">* Item price</label>
									<CurrencyInput
										className={styles.CreateSchedule__currentInput}
										autoFocus
										id="itemPrice"
										name="itemPrice"
										placeholder="Item price - $2.00 minimum"
										value={itemPrice}
										prefix="$"
										required
										decimalScale={2}
										decimalsLimit={2}
										onValueChange={(value, name) =>
											setValues((prev) => ({ ...prev, [name]: value }))
										}
									/>
									<label htmlFor="quantity">* Quantity</label>
									<input
										className={styles.CreateSchedule__currentInput}
										id="quantity"
										type="number"
										placeholder="Quantity"
										min="1"
										value={numAvailable}
										onChange={handleChange}
										name="numAvailable"
										required
									/>
								</div>
							</div>
							<div>
								<div className={styles.CreateSchedule__timeTitle}>
									<h3>Pick up time:</h3>
									<p>(12:00 am - 11:45 pm)</p>
								</div>
								<div className={styles.CreateSchedule__formTimes}>
									<div>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DesktopTimePicker
												label="Start time"
												required
												// className={styles.CreateSchedule__currentInput}
												value={startTime}
												onChange={(newValue) => {
													setValues((prev) => ({
														...prev,
														startTime: newValue,
													}));
												}}
												renderInput={(params) => <TextField {...params} />}
											/>
										</LocalizationProvider>
									</div>
									<div>
										<LocalizationProvider dateAdapter={AdapterDateFns}>
											<DesktopTimePicker
												label="End time"
												required
												className={styles.CreateSchedule__currentInput}
												value={endTime}
												onChange={(newValue) => {
													setValues((prev) => ({ ...prev, endTime: newValue }));
												}}
												renderInput={(params) => <TextField {...params} />}
											/>
										</LocalizationProvider>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className={styles.Form__bottom}>
						<div className={styles.Form__bottomCheckbox}>
							<input
								type="checkbox"
								id="recurring"
								name="recurring"
								value={recurring}
								onChange={handleChange}
							/>
							<label htmlFor="recurring" style={{ textAlign: "left" }}>
								* Check to default this schedule to reoccur weekly.
							</label>
						</div>

						{loading ? (
							<CircularProgress />
						) : (
							<Button
								variant="contained"
								type="submit"
								disabled={loading ? true : false}
							>
								Create
							</Button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

export default CreateSchedule;
