import { Button } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/dashboard/schedule/daycomponent.module.css";
import { useRouter } from "next/router";
import {
	collection,
	query,
	onSnapshot,
	where,
	doc,
	getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import {
	removeSchedule,
	pauseSchedule,
} from "../../../actions/dashboard/scheduleCrud";
import { updateOrder } from "../../../actions/dashboard/ordersCrud";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import SuccessError from "../Orders/SuccessError";
import ManualCreateSchedule from "./ManualCreateSchedule";
import EditScheduleModal from "../Orders/Incoming/EditScheduleModal";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

const styleAlert = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
};

function DayComponent({
	date,
	bizId,
	bizName,
	uid,
	userData,
	ordersDataArr,
	emoji,
}) {
	const [edit, setEdit] = useState({
		openEditModal: false,
		editDisabled: false,
		isPaused: false,
		editId: "",
	});
	const [scheduleRemove, setScheduleRemove] = useState({
		openRemoveModal: false,
		canRemoveEdit: false,
		removeEditScheduleId: "",
	});

	const [isNotificationSent, setIsNotificationSent] = useState(false);
	const [disableCreateButton, setDisableCreateButton] = useState(false);
	const [handleScheduleUpdates, setHandleScheduleUpdates] = useState({
		errorMessage: "",
		successMessage: "",
		isOpen: false,
	});
	const [isScheduledRemoved, setIsScheduledRemoved] = useState({
		removeMessage: "",
		removeSuccess: false,
		showRemoveMessage: false,
		removeScheduleId: "",
		canRemove: false,
		numberOfOrdersRegular: 0,
		orderDataArr: [],
	});
	const [isScheduleFlashRemoved, setIsScheduleFlashRemoved] = useState({
		flashRemoveMessage: "",
		flashRemoveSuccess: false,
		showFlashRemoveMessage: false,
		removeFlashId: "",
		canRemoveFlash: false,
		numberOfOrdersFlash: 0,
	});

	const [showRemoveModalFlash, setShowRemoveModalFlash] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [isToday, setIsToday] = useState(false);
	const [isTomorrow, setIsTomorrow] = useState(false);

	const [incOrders, setIncOrders] = useState({
		pendingCount: 0,
		incOrderErrorMessage: "",
	});

	const [flash, setFlash] = useState({
		postsFlash: [],
		timeDisplaysFlash: [],
		hasFlashOnDateComponent: false,
		errorLoadingFlash: "",
		currShortDate: "",
	});

	const [posts, setPosts] = useState([]);
	const [timeDisplays, setTimeDisplays] = useState([]);
	const [hasPostOnDateComponent, setHasPostOnDateComponent] = useState(false);

	const [postsRecur, setPostsRecur] = useState([]);
	const [timeDisplaysRecur, setTimeDisplaysRecur] = useState([]);
	const [hasPostOnDateComponentRecur, setHasPostOnDateComponentRecur] =
		useState(false);

	const [showCreateSchedule, setShowCreateSchedule] = useState(false);
	const [hoverState, setHoverState] = useState(true);
	const [errorLoadingPosts, setErrorLoadingPosts] = useState("");

	const { openRemoveModal, removeEditScheduleId, canRemoveEdit } =
		scheduleRemove;
	const { openEditModal, editDisabled, isPaused, editId } = edit;
	const {
		removeMessage,
		removeSuccess,
		showRemoveMessage,
		removeScheduleId,
		canRemove,
		numberOfOrdersRegular,
		orderDataArr,
	} = isScheduledRemoved;
	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
	const {
		flashRemoveMessage,
		flashRemoveSuccess,
		showFlashRemoveMessage,
		removeFlashId,
		canRemoveFlash,
		numberOfOrdersFlash,
	} = isScheduleFlashRemoved;
	const { pendingCount, incOrderErrorMessage } = incOrders;
	const { monthDay, dayOfWeek, dayOfWkIdx, actualDate, shortDate } = date;
	const hasOrders = ordersDataArr.filter(
		(order) => order.shortDate === shortDate
	);

	const keyFlash = {
		borderLeft: "3px solid var(--flash)",
		borderRight: "3px solid var(--flash)",
	};
	const keyGreen = {
		borderLeft: "3px solid var(--light-green)",
		borderRight: "3px solid var(--light-green)",
	};
	const keyGray = {
		borderLeft: "3px solid var(--gray)",
		borderRight: "3px solid var(--gray)",
	};
	const keyRed = {
		borderLeft: "3px solid var(--light-red)",
		borderRight: "3px solid var(--light-red)",
	};
	const keyOrange = {
		color: "var(--orange)",
		fontWeight: "500",
	};

	const router = useRouter();

	useEffect(() => {
		isItTodayOrTmw();

		if (!bizId) {
			return;
		}

		const unsubscribe = getSchedules(bizId);
		// const unsubscribeRecur = getSchedulesRecur(bizId);
		const unsubscribeIncOrders = getIncomingOrders(bizId);
		disableCreateToday();
		return () => {
			unsubscribe();
			// unsubscribeRecur();
			unsubscribeIncOrders();
		};

		//  eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid, bizId]);

	// * UseEffect ACTIONS --------------------------------

	function disableCreateToday() {
		const date = new Date().toDateString();
		const lastHourEpoch = Date.parse(
			date + " " + "23:59:99 GMT-0800 (Pacific Standard Time)"
		);
		const oneHourMiliSec = 60 * 60 * 1000;
		const currDate = new Date();
		const currEpoch = Date.parse(currDate);

		if (lastHourEpoch - currEpoch < oneHourMiliSec) {
			setDisableCreateButton(true);
		} else {
			setDisableCreateButton(false);
		}
	}

	function getSchedules(bizId) {
		const bizDocRef = doc(db, "biz", bizId);

		// TODO: query so it doesn't pull biz all the time

		// * Current short date for Flash
		const date = new Date();
		const currShortDate = date.toLocaleDateString();

		const unsubscribe = onSnapshot(
			bizDocRef,
			(doc) => {
				const bizData = doc.data();
				const weeklySchedules = bizData.weeklySchedules;
				const pausedSchedules = bizData.pausedSchedules;
				let todayPaused;
				let dayIdxObj;

				if (weeklySchedules !== undefined) {
					dayIdxObj = weeklySchedules[dayOfWkIdx];
				}

				if (pausedSchedules !== undefined) {
					todayPaused = pausedSchedules[dayOfWkIdx];
				}

				let schedId;
				let isNotified;

				// * Regular schedule
				const timeDisplayArr = [];
				const tempTimeDisplayArr = [];
				let hasPost = false;
				let schedArr = [];

				// * Recur schedule
				const timeDisplayArrRecur = [];
				const tempTimeDisplayArrRecur = [];
				let hasPostRecur = false;
				let schedArrRecur = [];

				// * Flash Schedule
				const timeDisplayArrFlash = [];
				const tempTimeDisplayArrFlash = [];
				let hasPostFlash = false;
				let schedArrFlash = [];

				for (const scheduleId in dayIdxObj) {
					const scheduleIdObj = dayIdxObj[scheduleId];
					const scheduleRecur = scheduleIdObj.recurring;
					const scheduleStatus = scheduleIdObj.status;
					schedId = scheduleId;
					isNotified = scheduleIdObj.notificationSent;

					const timeObj = {
						startTime: scheduleIdObj.startTime,
						timeDisplay: scheduleIdObj.timeDisplay,
						hourStart: scheduleIdObj.hourStart,
						minStart: scheduleIdObj.minStart,
					};

					if (scheduleStatus === "Flash") {
						if (!tempTimeDisplayArrFlash.includes(scheduleIdObj.timeDisplay)) {
							timeDisplayArrFlash.push(timeObj);
							tempTimeDisplayArrFlash.push(scheduleIdObj.timeDisplay);
						}
						schedArrFlash.push(scheduleIdObj);
						hasPostFlash = true;
					} else {
						if (scheduleRecur) {
							if (
								!tempTimeDisplayArrRecur.includes(scheduleIdObj.timeDisplay) &&
								!tempTimeDisplayArr.includes(scheduleIdObj.timeDisplay)
							) {
								timeDisplayArrRecur.push(timeObj);
								tempTimeDisplayArrRecur.push(scheduleIdObj.timeDisplay);
							}
							schedArrRecur.push(scheduleIdObj);
							hasPostRecur = true;
						} else {
							if (
								!tempTimeDisplayArr.includes(scheduleIdObj.timeDisplay) &&
								!tempTimeDisplayArrRecur.includes(scheduleIdObj.timeDisplay)
							) {
								timeDisplayArr.push(timeObj);
								tempTimeDisplayArr.push(scheduleIdObj.timeDisplay);
							}
							schedArr.push(scheduleIdObj);
							hasPost = true;
						}
					}
				}

				// * Set state for recur values
				for (const pausedId in todayPaused) {
					const currPaused = todayPaused[pausedId];
					const timeObj = {
						startTime: currPaused.startTime,
						timeDisplay: currPaused.timeDisplay,
						hourStart: currPaused.hourStart,
						minStart: currPaused.minStart,
					};

					if (
						!tempTimeDisplayArr.includes(currPaused.timeDisplay) &&
						!tempTimeDisplayArrRecur.includes(currPaused.timeDisplay)
					) {
						timeDisplayArr.push(timeObj);
						tempTimeDisplayArr.push(currPaused.timeDisplay);
					}

					schedArr.push(currPaused);
					hasPost = true;
				}

				setTimeDisplaysRecur(timeDisplayArrRecur);
				setHasPostOnDateComponentRecur(hasPostRecur);
				setPostsRecur(schedArrRecur);

				// * Set state for normal values
				setTimeDisplays(timeDisplayArr);
				setHasPostOnDateComponent(hasPost);
				setPosts(schedArr);

				// * Set state for flash values
				setFlash((prev) => ({
					...prev,
					postsFlash: schedArrFlash,
					timeDisplaysFlash: timeDisplayArrFlash,
					hasFlashOnDateComponent: hasPostFlash,
					currShortDate,
				}));
			},
			(error) => {
				console.log(`Error loading schedules: ${error}`);
				setHasPostOnDateComponent(false);
				setHasPostOnDateComponentRecur(false);
				setFlash((prev) => ({
					...prev,
					hasFlashOnDateComponent: false,
					errorLoadingFlash: `Error loading flash posts`,
				}));
				setErrorLoadingPosts("Error loading schedules.");
			}
		);

		return unsubscribe;
	}

	function getIncomingOrders(bizId) {
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		const bizOrdersRef = collection(db, "biz", bizId, "orders");
		// * statusIndex 0 = reserved, 1 = confirmed
		const queryIncOrders = query(
			bizOrdersRef,
			where("shortDate", "in", dateArr),
			where("statusIndex", "==", 0)
		);

		const unsubscribeIncOrders = onSnapshot(
			queryIncOrders,
			(querySnapshot) => {
				const reservedArr = [];

				querySnapshot.forEach((doc) => {
					const data = doc.data();
					reservedArr.push(data);
				});

				setIncOrders({
					pendingCount: reservedArr.length,
					incOrderErrorMessage: "",
				});
			},
			(error) => {
				setIncOrders({
					incOrderErrorMessage: `Error loading orders. ${error}`,
				});
			}
		);

		return unsubscribeIncOrders;
	}

	function isItTodayOrTmw() {
		const today = new Date().getDay() + 1;

		if (today === dayOfWkIdx) {
			setIsToday(true);
		}

		if (today + 1 === 8 && dayOfWkIdx === 1) {
			setIsTomorrow(true);
		}

		if (today + 1 === dayOfWkIdx) {
			setIsTomorrow(true);
		}
	}

	// * ACTIONS --------------------------------

	function handleCreateClick() {
		setShowCreateSchedule((prev) => !prev);
		setHoverState((prev) => !prev);
		router.replace(router.asPath);
	}

	function handleClickAway() {
		setShowCreateSchedule(false);
		setHoverState(true);
	}

	async function handleRemoveSchedule(e, scheduleId, dayIndex) {
		if (orderDataArr.length > 0) {
			let success = true;
			let message;

			for (let i = 0; i < orderDataArr.length; i++) {
				const currOrder = orderDataArr[i];
				const { customerId, orderId } = currOrder;
				const reason = "Offer removed";

				const resUpdateOrder = await updateOrder(
					customerId,
					orderId,
					bizId,
					"Declined",
					2,
					reason,
					null,
					null,
					null,
					null,
					null,
					null
				);

				if (!resUpdateOrder.success) {
					success = false;
					message = resUpdateOrder.message;
				}
			}

			if (success) {
				await removeScheduleRegular(scheduleId, dayIndex);
			} else {
				console.log(`Tomorrows removed order was not updated: ${message}`);
				return;
			}
		} else {
			await removeScheduleRegular(scheduleId, dayIndex);
		}
	}

	const removeScheduleRegular = async (scheduleId, dayIndex) => {
		const { success, message } = await removeSchedule(
			bizId,
			scheduleId,
			dayIndex,
			null
		);

		if (success) {
			// setHandleScheduleUpdates({
			// 	errorMessage: null,
			// 	successMessage: "Removed.",
			// 	isOpen: true,
			// });
			setShowRemoveModal(false);
			handleCloseEdit();
		} else {
			setShowRemoveModal(false);
			setIsScheduledRemoved({
				removeSuccess: false,
				showRemoveMessage: true,
				removeMessage: message,
			});
		}
	};

	const handlePauseSchedule = async (scheduleId, dayIndex) => {
		const { success, message } = await pauseSchedule(
			bizId,
			scheduleId,
			dayIndex,
			null
		);

		if (success) {
			setShowRemoveModal(false);
			setHandleScheduleUpdates({
				errorMessage: null,
				successMessage: "Removed.",
				isOpen: true,
			});
		} else {
			setShowRemoveModal(false);
			setIsScheduledRemoved({
				removeSuccess: false,
				showRemoveMessage: true,
				removeMessage: message,
			});
		}
	};

	async function handleRemoveScheduleFlash(e, scheduleId, dayIndex) {
		const event = "Flash";
		const { success, message } = await removeSchedule(
			bizId,
			scheduleId,
			dayIndex,
			event
		);

		if (success) {
			setShowRemoveModalFlash(false);
			setHandleScheduleUpdates({
				errorMessage: null,
				successMessage: "Removed.",
				isOpen: true,
			});
		} else {
			setShowRemoveModalFlash(false);
			setIsScheduleFlashRemoved({
				flashRemoveSuccess: false,
				showFlashRemoveMessage: true,
				flashRemoveMessage: message,
			});
		}
	}

	const handleRemoveClick = async (eventType, event) => {
		if (eventType === "flash") {
			const flash = event;
			const currDate = new Date();
			const currEpoch = Date.parse(currDate);

			if (currEpoch > event.endTime) {
				setShowRemoveModalFlash(true);
				setIsScheduleFlashRemoved((prev) => ({
					...prev,
					canRemoveFlash: false,
				}));
			} else {
				setShowRemoveModalFlash(true);
				setIsScheduleFlashRemoved((prev) => ({
					...prev,
					removeFlashId: flash.id,
					canRemoveFlash: true,
				}));
			}
		}

		if (eventType === "regular") {
			const schedule = event;
			const currDate = new Date();
			const currEpoch = Date.parse(currDate);

			if (currEpoch > schedule.endTime) {
				setShowRemoveModal(true);
				setIsScheduledRemoved((prev) => ({
					...prev,
					canRemove: false,
					orderDataArr: [],
				}));
			} else {
				const scheduleId = schedule.id;
				const { numOrders, ordersData } = await getOrders(scheduleId);

				setShowRemoveModal(true);
				setIsScheduledRemoved((prev) => ({
					...prev,
					removeScheduleId: schedule.id,
					canRemove: true,
					numberOfOrdersRegular: numOrders,
					orderDataArr: ordersData,
				}));
			}
		}
	};

	const handleRemoveEdit = (schedule) => {
		const currDate = new Date();
		const currEpoch = Date.parse(currDate);

		if (currEpoch > schedule.endTime) {
			setScheduleRemove((prev) => ({
				...prev,
				openRemoveModal: true,
				canRemoveEdit: false,
			}));
		} else {
			setScheduleRemove((prev) => ({
				...prev,
				openRemoveModal: true,
				canRemoveEdit: true,
				removeEditScheduleId: schedule.id,
			}));
		}
	};

	const getOrders = async (scheduleId) => {
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const queryOrders = query(
			ordersDocRef,
			where("pickupWindowId", "==", scheduleId)
		);

		try {
			const ordersSnapshot = await getDocs(queryOrders);
			const numOrders = ordersSnapshot.size;
			const ordersData = [];

			ordersSnapshot.forEach((doc) => {
				const data = doc.data();
				const customerId = data.customerId;
				const orderId = doc.id;

				const orderDataObj = {
					customerId,
					orderId,
				};

				ordersData.push(orderDataObj);
			});

			return { numOrders, ordersData };
		} catch (error) {
			console.log("Error getting orders", error);
			return;
		}
	};

	const handleEdit = (e, endTime, isPaused, scheduleId) => {
		const currDate = new Date();
		const currEpoch = Date.parse(currDate);
		console.log("endTime", endTime);
		if (currEpoch < endTime) {
			setEdit((prev) => ({
				...prev,
				openEditModal: true,
				editDisabled: false,
				isPaused: isPaused,
				editId: scheduleId,
			}));
		} else {
			setEdit((prev) => ({
				...prev,
				openEditModal: true,
				editDisabled: true,
				isPaused: isPaused,
			}));
		}
	};

	const handleCloseEdit = () => {
		setEdit((prev) => ({
			...prev,
			openEditModal: false,
			editId: "",
			editDisabled: false,
		}));
		setScheduleRemove((prev) => ({
			...prev,
			openRemoveModal: false,
			canRemoveEdit: false,
			removeEditScheduleId: "",
		}));
	};

	const handleCloseRemoveModal = () => {
		setScheduleRemove((prev) => ({
			...prev,
			openRemoveModal: false,
			removeScheduleId: "",
		}));
	};

	return (
		<div className={styles.DayComponent__container}>
			{errorMessage && (
				<SuccessError
					handleOrderUpdate={handleScheduleUpdates}
					setHandleOrderUpdates={setHandleScheduleUpdates}
				/>
			)}
			<Modal
				open={showRemoveMessage}
				onClose={() => setIsScheduledRemoved({ showRemoveMessage: false })}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={styleAlert}>
					<Grid item xs={12} md={12}>
						<Collapse in={showRemoveMessage}>
							<Alert
								severity={removeSuccess === true ? "success" : "error"}
								onClose={() =>
									setIsScheduledRemoved({ showRemoveMessage: false })
								}
							>
								{removeMessage}
							</Alert>
						</Collapse>
					</Grid>
				</Box>
			</Modal>
			<Modal
				open={showFlashRemoveMessage}
				onClose={() =>
					setIsScheduleFlashRemoved({ showFlashRemoveMessage: false })
				}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={styleAlert}>
					<Grid item xs={12} md={12}>
						<Collapse in={showFlashRemoveMessage}>
							<Alert
								severity={flashRemoveSuccess === true ? "success" : "error"}
								onClose={() =>
									setIsScheduleFlashRemoved({ showFlashRemoveMessage: false })
								}
							>
								{flashRemoveMessage}
							</Alert>
						</Collapse>
					</Grid>
				</Box>
			</Modal>
			<div
				className={`${styles.DayComponent}  ${
					hoverState && styles.DayComponent_hover
				} ${
					hoverState &&
					(isToday || isTomorrow) &&
					styles.DayComponent__todayTomorrowDesign
				}`}
			>
				<div className={styles.DayComponent__postHeaderFooter}>
					<div className={styles.DayComponent__titles}>
						<h4>{dayOfWeek}</h4>
						<p className={styles.DayComponent__date}>{monthDay}</p>
					</div>
					{isToday ? (
						<div>
							<h5>Today </h5>
						</div>
					) : isTomorrow ? (
						<div>
							<h5>Tomorrow </h5>
						</div>
					) : (
						<div
							style={{
								visibility: "hidden",
							}}
						>
							<h4>Today </h4>
						</div>
					)}
					<div className={`${styles.ManualCreateBtn__Container}`}>
						<Button
							onClick={handleCreateClick}
							variant="contained"
							disabled={isToday && disableCreateButton}
						>
							Create
						</Button>
					</div>
					<ManualCreateSchedule
						open={showCreateSchedule}
						close={handleClickAway}
						uid={uid}
						date={date}
						bizId={bizId}
						userData={userData}
						shortDate={shortDate}
						emoji={emoji}
					/>
				</div>
				<div
					className={`${styles.DayComponent__body} ${
						(isToday || isTomorrow) && styles.DayComponent__todayTomorrow
					}`}
				>
					{flash.postsFlash.length !== 0 &&
					flash.currShortDate === shortDate ? (
						<div className={styles.DayComponent__postsFlash}>
							{flash.errorLoadingFlash ? (
								<p>{flash.errorLoadingFlash}</p>
							) : (
								flash.timeDisplaysFlash
									.sort((a, b) => {
										if (a.hourStart === b.hourStart) {
											return a.minStart - b.minStart;
										} else {
											return a.hourStart - b.hourStart;
										}
									})
									.map((time, i) => {
										return (
											<div
												className={styles.DayComponent__bodyDetailFlash}
												key={i}
											>
												<p className={styles.DayComponent__pickUpTime}>
													{time.timeDisplay}
												</p>

												{flash.postsFlash.map((flash, i) => {
													if (flash.timeDisplay === time.timeDisplay) {
														return (
															<div
																key={flash.id}
																className={styles.DayComponent__bodyDetailTrue}
																style={
																	isToday || isTomorrow
																		? flash.endTime > Date.parse(new Date())
																			? flash.numAvailable > 0
																				? keyFlash
																				: keyGray
																			: keyGray
																		: keyGray
																}
															>
																<p
																	className={
																		styles.DayComponent__bodyDetailTrue__live
																	}
																	style={{
																		color: "white",
																		backgroundColor:
																			isToday || isTomorrow
																				? flash.endTime > Date.parse(new Date())
																					? flash.numAvailable > 0
																						? "var(--flash)"
																						: "var(--gray)"
																					: "var(--gray)"
																				: "var(--gray)",
																	}}
																>
																	{isToday || isTomorrow
																		? flash.endTime > Date.parse(new Date())
																			? flash.numAvailable > 0
																				? "Flash"
																				: "Sold out"
																			: "Past"
																		: "Scheduled"}
																</p>
																<p>{flash.itemPrice}</p>
																<div className={styles.bodyDetailTrue__item}>
																	<p>{flash.numAvailable}x</p>

																	<p>{flash.itemName}</p>
																</div>

																{flash.recurring ? (
																	<p
																		style={{
																			color: "var(--gray)",
																		}}
																	>
																		RECUR
																	</p>
																) : (
																	<p
																		style={{
																			color: "var(--gray)",

																			textDecoration: "line-through",
																		}}
																	>
																		RECUR
																	</p>
																)}

																<Button
																	variant="text"
																	color="error"
																	size="small"
																	// disabled={
																	// 	flash.numAvailable < flash.numAvailableStart
																	// 		? true
																	// 		: false
																	// }
																	onClick={() =>
																		handleRemoveClick("flash", flash)
																	}
																>
																	remove
																</Button>

																<Modal
																	open={showRemoveModalFlash}
																	onClose={() => setShowRemoveModalFlash(false)}
																	aria-labelledby="modal-modal-title"
																	aria-describedby="modal-modal-description"
																>
																	<Box sx={style}>
																		<div
																			className={`${styles.RemoveConfirm__Container}`}
																		>
																			<Typography
																				id="modal-modal-title"
																				variant="h6"
																				component="h2"
																			>
																				{canRemoveFlash
																					? "Removing set schedule"
																					: "Can't remove"}
																			</Typography>
																			<Typography
																				id="modal-modal-description"
																				sx={{ mt: 5, mb: 5 }}
																			>
																				{canRemoveFlash
																					? "Are you sure you want to remove this post?"
																					: "Cannot remove during pickup time, or if time has passed."}
																			</Typography>
																			<div>
																				{canRemoveFlash && (
																					<Button
																						variant="contained"
																						color="error"
																						sx={{ mr: 5 }}
																						onClick={(e) =>
																							handleRemoveScheduleFlash(
																								e,
																								removeFlashId,
																								flash.dayOfWkIdx
																							)
																						}
																					>
																						Remove
																					</Button>
																				)}
																				<Button
																					variant="outlined"
																					onClick={() =>
																						setShowRemoveModalFlash(false)
																					}
																				>
																					Close
																				</Button>
																			</div>
																		</div>
																	</Box>
																</Modal>
															</div>
														);
													}
												})}
											</div>
										);
									})
							)}
						</div>
					) : (
						<p style={{ display: "none" }}>No Flash</p>
					)}

					<div className={styles.DayComponent__postsRegular}>
						{errorLoadingPosts ? (
							<p>{errorLoadingPosts}</p>
						) : hasPostOnDateComponent || hasPostOnDateComponentRecur ? (
							timeDisplays
								.concat(timeDisplaysRecur)
								.sort((a, b) => {
									if (a.hourStart === b.hourStart) {
										return a.minStart - b.minStart;
									} else {
										return a.hourStart - b.hourStart;
									}
								})
								.map((time, i) => {
									return (
										<div className={styles.DayComponent__bodyDetail} key={i}>
											<p className={styles.DayComponent__pickUpTime}>
												{time.timeDisplay}
											</p>

											{posts.concat(postsRecur).map((schedule, i) => {
												if (schedule.timeDisplay === time.timeDisplay) {
													return (
														<div
															key={i}
															className={styles.DayComponent__bodyDetailTrue}
															style={
																!schedule.isPaused
																	? isToday || isTomorrow
																		? schedule.endTime > Date.parse(new Date())
																			? schedule.numAvailable > 0
																				? keyGreen
																				: keyGray
																			: keyGray
																		: keyGray
																	: keyGray
															}
														>
															<p
																className={
																	styles.DayComponent__bodyDetailTrue__live
																}
																style={{
																	color: "white",
																	backgroundColor: !schedule.isPaused
																		? isToday || isTomorrow
																			? schedule.endTime >
																			  Date.parse(new Date())
																				? schedule.numAvailable > 0
																					? "var(--light-green)"
																					: "var(--light-red)"
																				: "var(--gray)"
																			: "var(--gray)"
																		: "var(--gray)",
																}}
															>
																{!schedule.isPaused
																	? isToday || isTomorrow
																		? schedule.endTime > Date.parse(new Date())
																			? schedule.numAvailable > 0
																				? "Live"
																				: "Sold out"
																			: "Past"
																		: "Scheduled"
																	: "Pause"}
															</p>
															<p>{schedule.itemPrice}</p>
															<div className={styles.bodyDetailTrue__item}>
																<p>{schedule.numAvailable}x</p>

																<p className={styles.bodyDetailTrue__itemName}>
																	{schedule.itemName}
																</p>
															</div>
															{schedule.recurring ? (
																<p
																	style={{
																		color: "var(--gray)",
																	}}
																>
																	RECUR
																</p>
															) : (
																<p
																	style={{
																		color: "var(--gray)",
																		textDecoration: "line-through",
																	}}
																>
																	RECUR
																</p>
															)}
															{schedule.recurring ? (
																<Button
																	variant="text"
																	color="info"
																	onClick={(e) =>
																		handleEdit(
																			e,
																			schedule.endTime,
																			schedule.isPaused,
																			schedule.id
																		)
																	}
																>
																	edit
																</Button>
															) : (
																<Button
																	variant="text"
																	color="error"
																	onClick={() =>
																		handleRemoveClick("regular", schedule)
																	}
																>
																	remove
																</Button>
															)}
															{openEditModal && (
																<EditScheduleModal
																	isPaused={isPaused}
																	bizId={bizId}
																	isOpen={openEditModal}
																	close={handleCloseEdit}
																	handleRemoveSchedule={removeScheduleRegular}
																	handlePauseSchedule={handlePauseSchedule}
																	dayIdx={dayOfWkIdx}
																	scheduleId={editId}
																	editDisabled={editDisabled}
																	handleRemove={handleRemoveEdit}
																	openRemove={openRemoveModal}
																	closeRemove={handleCloseRemoveModal}
																	canRemove={canRemoveEdit}
																	openErrorModal={showRemoveMessage}
																	errorMessage={removeMessage}
																	destination={"schedule"}
																	schedule={schedule}
																/>
															)}
															<Modal
																open={showRemoveModal}
																onClose={() => setShowRemoveModal(false)}
																aria-labelledby="modal-modal-title"
																aria-describedby="modal-modal-description"
															>
																<Box sx={style}>
																	<div
																		className={`${styles.RemoveConfirm__Container}`}
																	>
																		<Typography
																			id="modal-modal-title"
																			variant="h6"
																			component="h2"
																		>
																			{canRemove
																				? "Removing set schedule"
																				: "Can't remove"}
																		</Typography>

																		<div style={{ margin: "30px 0 40px 0" }}>
																			{canRemove ? (
																				numberOfOrdersRegular > 0 ? (
																					<div
																						className={`${styles.RemovePost}`}
																					>
																						<p
																							className={`${styles.RemovePost__numReservered}`}
																						>
																							🛑{" "}
																							<b>
																								{" "}
																								{numberOfOrdersRegular}{" "}
																								reserveration(s)
																							</b>
																						</p>
																						<p
																							className={`${styles.RemovePost__description}`}
																						>
																							Removing this post will decline
																							all reservations.
																						</p>

																						<p
																							className={`${styles.RemovePost__note}`}
																						>
																							Note: customers can pre-reserve
																							orders for the next day.
																						</p>
																					</div>
																				) : (
																					<p
																						className={`${styles.RemovePost__noOrders}`}
																					>
																						Are you sure you want to remove the
																						schedule?
																					</p>
																				)
																			) : (
																				<p>
																					Cannot remove after scheduled time.
																				</p>
																			)}
																		</div>

																		<div>
																			{canRemove && (
																				<Button
																					variant="contained"
																					color="error"
																					sx={{ mr: 5 }}
																					onClick={(e) =>
																						handleRemoveSchedule(
																							e,
																							removeScheduleId,
																							schedule.dayOfWkIdx
																						)
																					}
																				>
																					Remove
																				</Button>
																			)}
																			<Button
																				variant="outlined"
																				onClick={() =>
																					setShowRemoveModal(false)
																				}
																			>
																				Close
																			</Button>
																		</div>
																	</div>
																</Box>
															</Modal>
														</div>
													);
												}
											})}
										</div>
									);
								})
						) : flash.postsFlash.length !== 0 &&
						  flash.currShortDate === shortDate ? (
							<p style={{ display: "none" }}>{bizName}: None</p>
						) : (
							<p className={styles.DayComponent__bodyDetailFalse}>
								{bizName}: None
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default DayComponent;
