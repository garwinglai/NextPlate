import { ClickAwayListener, Button, Avatar } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/dashboard/schedule/daycomponent.module.css";
import CreateSchedule from "./CreateSchedule";
import { useRouter } from "next/router";
import Link from "next/link";
import {
	collection,
	query,
	onSnapshot,
	where,
	getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { removeSchedule } from "../../../actions/dashboard/scheduleCrud";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import SuccessError from "../Orders/SuccessError";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
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

function DayComponent({ date, bizId, uid, userData, ordersDataArr, flash }) {
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
	});
	const [isScheduleFlashRemoved, setIsScheduleFlashRemoved] = useState({
		flashRemoveMessage: "",
		flashRemoveSuccess: false,
		showFlashRemoveMessage: false,
		removeFlashId: "",
	});

	const [showRemoveModalFlash, setShowRemoveModalFlash] = useState(false);
	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [isToday, setIsToday] = useState(false);
	const [isTomorrow, setIsTomorrow] = useState(false);

	const [incOrders, setIncOrders] = useState({
		pendingCount: 0,
		incOrderErrorMessage: "",
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

	const { errorMessage, successMessage, isOpen } = handleScheduleUpdates;
	const {
		flashRemoveMessage,
		flashRemoveSuccess,
		showFlashRemoveMessage,
		removeFlashId,
	} = isScheduleFlashRemoved;
	const { removeMessage, removeSuccess, showRemoveMessage, removeScheduleId } =
		isScheduledRemoved;
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
		const unsubscribeRecur = getSchedulesRecur(bizId);
		const unsubscribeIncOrders = getIncomingOrders(bizId);

		return () => {
			unsubscribe();
			unsubscribeRecur();
			unsubscribeIncOrders();
		};

		//  eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid, bizId]);

	// * UseEffect ACTIONS --------------------------------

	function getSchedules(bizId) {
		const openHistoryRef = collection(db, "biz", bizId, "openHistory");

		const q = query(
			openHistoryRef,
			where("scheduledDateShort", "==", shortDate),
			where("recurring", "==", false),
			where("status", "==", "Regular")
		);

		const unsubscribe = onSnapshot(
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
						if (!tempTimeDisplayArr.includes(curr.startTime)) {
							timeDisplayArr.push(timeObj);
							tempTimeDisplayArr.push(curr.startTime);
						}
					}

					setTimeDisplays(timeDisplayArr);
					setHasPostOnDateComponent(true);
					setPosts(schedArr);
				} else {
					setHasPostOnDateComponent(false);
				}
			},
			(error) => {
				setHasPostOnDateComponent(false);
				setErrorLoadingPosts(`Error fetching posts: ${error}`);
			}
		);

		return unsubscribe;
	}

	function getSchedulesRecur(bizId) {
		const openHistoryRef = collection(db, "biz", bizId, "openHistory");

		const qRecur = query(
			openHistoryRef,
			// where("scheduledDateShort", "==", shortDate),
			where("dayOfWeek", "==", dayOfWeek),
			where("recurring", "==", true)
		);

		const unsubscribeRecur = onSnapshot(
			qRecur,
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
						if (!tempTimeDisplayArr.includes(curr.startTime)) {
							timeDisplayArr.push(timeObj);
							tempTimeDisplayArr.push(curr.startTime);
						}
					}

					setTimeDisplaysRecur(timeDisplayArr);
					setHasPostOnDateComponentRecur(true);
					setPostsRecur(schedArr);
				} else {
					setHasPostOnDateComponentRecur(false);
				}
			},
			(error) => {
				setHasPostOnDateComponentRecur(false);
				setErrorLoadingPosts(`Error fetching posts: ${error}`);
			}
		);

		return unsubscribeRecur;
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
		const { success, message } = await removeSchedule(
			bizId,
			scheduleId,
			dayIndex
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
	}

	async function handleRemoveScheduleFlash(e, scheduleId, dayIndex) {
		console.log(scheduleId, dayIndex);

		const { success, message } = await removeSchedule(
			bizId,
			scheduleId,
			dayIndex
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
			setIsScheduledRemoved({
				flashRemoveSuccess: false,
				showFlashRemoveMessage: true,
				flashRemoveMessage: message,
			});
		}
	}

	return (
		<div className={styles.DayComponent__container}>
			{(errorMessage || successMessage) && (
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
					<ClickAwayListener onClickAway={handleClickAway}>
						<div>
							<Button
								onClick={handleCreateClick}
								variant="contained"
								size="small"
							>
								Create
							</Button>

							{showCreateSchedule && (
								<div className={styles.DayComponent_clickAwayListerner}>
									<div
										className={styles.DayComponent__createScheduleContainer}
									></div>
									<CreateSchedule
										uid={uid}
										onClose={handleCreateClick}
										date={date}
										bizId={bizId}
										userData={userData}
										shortDate={shortDate}
									/>
								</div>
							)}
						</div>
					</ClickAwayListener>
				</div>
				<div
					className={`${styles.DayComponent__body} ${
						(isToday || isTomorrow) && styles.DayComponent__todayTomorrow
					}`}
				>
					{flash.currShortDate === shortDate ? (
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
																		? flash.numAvailable > 0
																			? keyFlash
																			: keyRed
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
																				? flash.numAvailable > 0
																					? "var(--flash)"
																					: "var(--light-red)"
																				: "var(--gray)",
																	}}
																>
																	{isToday || isTomorrow
																		? flash.numAvailable > 0
																			? "Flash"
																			: "Sold out"
																		: "Scheduled"}
																</p>
																<p>{flash.itemPrice}</p>
																<div className={styles.bodyDetailTrue__item}>
																	<p>{flash.numAvailable}x</p>

																	<p>{flash.itemName}</p>
																</div>

																{flash.reccurring ? (
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
																	onClick={() => {
																		setShowRemoveModalFlash(true);
																		setIsScheduleFlashRemoved((prev) => ({
																			...prev,
																			removeFlashId: flash.id,
																		}));
																	}}
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
																		<Typography
																			id="modal-modal-title"
																			variant="h6"
																			component="h2"
																		>
																			Removing set schedule
																		</Typography>
																		<Typography
																			id="modal-modal-description"
																			sx={{ mt: 2, mb: 2 }}
																		>
																			Are you sure you want to remove the
																			schedule?
																		</Typography>
																		<div>
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
																			<Button
																				variant="text"
																				onClick={() =>
																					setShowRemoveModalFlash(false)
																				}
																			>
																				Close
																			</Button>
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
															key={schedule.id}
															className={styles.DayComponent__bodyDetailTrue}
															style={
																isToday || isTomorrow
																	? schedule.numAvailable > 0
																		? keyGreen
																		: keyRed
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
																			? schedule.numAvailable > 0
																				? "var(--light-green)"
																				: "var(--light-red)"
																			: "var(--gray)",
																}}
															>
																{isToday || isTomorrow
																	? schedule.numAvailable > 0
																		? "Live"
																		: "Sold out"
																	: "Scheduled"}
															</p>
															<p>{schedule.itemPrice}</p>
															<div className={styles.bodyDetailTrue__item}>
																<p>{schedule.numAvailable}x</p>

																<p>{schedule.itemName}</p>
															</div>
															{schedule.reccurring ? (
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
																onClick={() => {
																	setShowRemoveModal(true);
																	setIsScheduledRemoved((prev) => ({
																		...prev,
																		removeScheduleId: schedule.id,
																	}));
																}}
															>
																remove
															</Button>
															<Modal
																open={showRemoveModal}
																onClose={() => setShowRemoveModal(false)}
																aria-labelledby="modal-modal-title"
																aria-describedby="modal-modal-description"
															>
																<Box sx={style}>
																	<Typography
																		id="modal-modal-title"
																		variant="h6"
																		component="h2"
																	>
																		Removing set schedule
																	</Typography>
																	<Typography
																		id="modal-modal-description"
																		sx={{ mt: 2, mb: 2 }}
																	>
																		Are you sure you want to remove the
																		schedule?
																	</Typography>
																	<div>
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
																		<Button
																			variant="text"
																			onClick={() => setShowRemoveModal(false)}
																		>
																			Close
																		</Button>
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
						) : flash.currShortDate === shortDate ? (
							<p style={{ display: "none" }}>No Posts</p>
						) : (
							<p className={styles.DayComponent__bodyDetailFalse}>No Posts</p>
						)}
					</div>
				</div>
				{(isToday || isTomorrow) && (
					<div className={styles.DayComponent__postHeaderFooter}>
						<div className={styles.DayComponent__titles}>
							<h4 className={styles.DayComponent__bodyTitle}>Orders:</h4>

							{hasOrders.length !== 0 ? (
								pendingCount !== 0 && (
									<div className={styles.DayComponent__orderStatus}>
										<h5
											className={styles.DayComponent__bodyOrderTrue}
											style={{ color: "var(--dark-gray)", fontSize: "14px" }}
										>
											{pendingCount}x
										</h5>
										<h5 style={keyOrange}>Pending</h5>
									</div>
								)
							) : (
								<p className={styles.DayComponent__bodyOrderFalse}>No Orders</p>
							)}
						</div>

						<Link href={`/dashboard/${uid}/orders/incoming-orders`}>
							<a>
								<Button size="small" variant="outlined">
									View
								</Button>
							</a>
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

export default DayComponent;
