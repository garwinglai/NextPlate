import React, { useEffect, useState } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import styles from "../../../styles/pages/dashboard/dashboard.module.css";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { IconButton, ClickAwayListener, Button, Grid } from "@mui/material";
import {
	collection,
	query,
	onSnapshot,
	where,
	doc,
	getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";
import { getLocalStorage } from "../../../actions/auth/auth";
import Image from "next/image";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { getBiz } from "../../../actions/crud/bizUser";
import MyLoader from "../../../helper/MyLoader";

// * Conditional Styling *********************************

function statusStyle(status) {
	if (status === "Declined" || status === "Cancelled" || status === "No Show") {
		return {
			color: "white",
			backgroundColor: "var(--light-red)",
			borderRadius: "5px",
			padding: "2px 5px",
		};
	} else if (status === "Reserved") {
		return {
			color: "white",
			borderRadius: "5px",
			padding: "2px 5px",
			backgroundColor: "var(--orange)",
		};
	} else if (status === "Confirmed") {
		return {
			color: "white",
			borderRadius: "5px",
			padding: "2px 5px",
			backgroundColor: "var(--light-green)",
		};
	} else if (status === "Completed") {
		return {
			color: "white",
			borderRadius: "5px",
			padding: "2px 5px",
			backgroundColor: "var(--dark-blue)",
		};
	}
}

function statusBordersOrders(status) {
	if (status === "Declined" || status === "Cancelled" || status === "No Show") {
		return {
			borderLeft: "3px solid var(--light-red)",
			borderRight: "3px solid var(--light-red)",
		};
	} else if (status === "Reserved") {
		return {
			borderLeft: "3px solid var(--orange)",
			borderRight: "3px solid var(--orange)",
		};
	} else if (status === "Confirmed") {
		return {
			borderLeft: "3px solid var(--light-green)",
			borderRight: "3px solid var(--light-green)",
		};
	} else if (status === "Completed") {
		return {
			borderLeft: "3px solid var(--dark-blue)",
			borderRight: "3px solid var(--dark-blue)",
		};
	}
}

function statusBordersPostsFlash(numAvailable) {
	if (numAvailable <= 0) {
		return {
			borderLeft: "3px solid var(--light-red)",
			borderRight: "3px solid var(--light-red)",
		};
	}
	return {
		borderLeft: "3px solid var(--flash)",
		borderRight: "3px solid var(--flash)",
	};
}

function statusBordersPosts(numAvailable) {
	if (numAvailable <= 0) {
		return {
			borderLeft: "3px solid var(--light-red)",
			borderRight: "3px solid var(--light-red)",
		};
	}
	return {
		borderLeft: "3px solid var(--light-green)",
		borderRight: "3px solid var(--light-green)",
	};
}

function Dashboard() {
	const [isOpen, setIsOpen] = useState(false);
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const [bizStatus, setBizStatus] = useState({
		bizData: {},
		status: 0,
		statusMessage: "",
		error: "",
	});
	const [pickupWindowArr, setPickupWindowArr] = useState({
		pickupToday: [],
		pickupTomorrow: [],
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [twoDays, setTwoDays] = useState([
		{
			monthDay: "",
			dayOfWeek: "",
			dayOfWeekShort: "",
			dayOfWkIdx: 0,
			actualDate: "",
			shortDate: "",
			statusTodayOrTomorrow: 0,
		},
	]);
	const [loadOrders, setLoadOrders] = useState({
		hasOrdersToday: false,
		hasOrdersTomorrow: false,
		orderData: [],
		pickupWindows: [],
		loadingOrders: false,
		orderMessage: "",
		ordersCount: 0,
		totalRevenue: 0,
	});
	const [loadPosts, setLoadPosts] = useState({
		hasPostsToday: false,
		hasPostsTomorrow: false,
		postData: [],
		loadingPosts: false,
		postMessage: "",
		postsCount: 0,
	});
	const [loadPostsRecur, setLoadPostsRecur] = useState({
		hasPostsRecurToday: false,
		hasPostsRecurTomorrow: false,
		postDataRecur: [],
		loadingPostsRecur: false,
		postMessageRecur: "",
	});
	const [loadPostsFlash, setLoadPostsFlash] = useState({
		postDataFlash: [],
		hasPostFlash: false,
		loadingPostsFlash: false,
		postMessageFlash: "",
		timeDisplaysFlash: [],
		currShortDate: "",
	});

	const {
		postDataFlash,
		hasPostFlash,
		timeDisplaysFlash,
		loadingPostsFlash,
		postMessageFlash,
		currShortDate,
	} = loadPostsFlash;
	const { storedUser, bizId } = user;
	const { bizData, status, statusMessage, error } = bizStatus;
	const { pickupToday, pickupTomorrow } = pickupWindowArr;
	const {
		hasPostsRecurToday,
		hasPostsRecurTomorrow,
		postDataRecur,
		loadingPostsRecur,
		postMessageRecur,
	} = loadPostsRecur;
	const {
		hasPostsToday,
		hasPostsTomorrow,
		postData,
		loadingPosts,
		postMessage,
		postsCount,
	} = loadPosts;
	const {
		hasOrdersToday,
		hasOrdersTomorrow,
		orderData,
		pickupWindows,
		loadingOrders,
		orderMessage,
		ordersCount,
		totalRevenue,
	} = loadOrders;

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
		getPostsOrdersCount(bizIdTemp);
		getBizStatus(bizIdTemp);
		const unSubOrders = getOrders(bizIdTemp);
		const unsubPosts = getPosts(bizIdTemp);
		const unsubPostsRecur = getPostsRecur(bizIdTemp);
		const unsubscribeFlash = getFlashSchedules(bizIdTemp);

		return () => {
			unsubPosts();
			unSubOrders();
			unsubPostsRecur();
			unsubscribeFlash();
		};

		//  eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uid]);

	// * UseEffect ACTIONS -----------------------------

	async function getBizStatus(bizId) {
		const resBiz = await getBiz(bizId, null);

		if (resBiz.success) {
			const data = resBiz.docData;
			const bStatus = data.status;

			if (bStatus === 0) {
				setBizStatus((prev) => ({
					...prev,
					bizData: data,
					status: bStatus,
					statusMessage:
						"This account has not been approved yet. Any changes will not be live.",
				}));
				setIsAlertOpen(true);
			} else {
				setBizStatus((prev) => ({
					...prev,
					bizData: data,
					status: bStatus,
				}));
				setIsAlertOpen(false);
				setIsOpen(true);
			}
		} else {
			setBizStatus((prev) => ({ ...prev, error: resBiz.message }));
			setIsAlertOpen(true);
		}
	}

	function getOrders(bizId) {
		setLoadOrders((prev) => ({ ...prev, loadingOrders: true }));
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		const ordersCollectionRef = collection(db, "biz", bizId, "orders");
		const q = query(ordersCollectionRef, where("shortDate", "in", dateArr));

		const unsub = onSnapshot(
			q,
			(querySnapshot) => {
				const ordersArr = [];
				querySnapshot.forEach((doc) => {
					const orderData = doc.data();
					orderData.orderId = doc.id;
					ordersArr.push(orderData);
				});
				if (ordersArr.length === 0) {
					setLoadOrders((prev) => ({
						...prev,
						loadingOrders: false,
						hasOrdersToday: false,
						hasOrdersTomorrow: false,
						orderData: [],
						orderMessage: "",
					}));
				} else {
					const shortDateToday = new Date();
					const shortDateTomorrow = new Date();
					shortDateTomorrow.setDate(shortDateTomorrow.getDate() + 1);

					const ordersToday = ordersArr.filter(
						(item) => item.shortDate === shortDateToday.toLocaleDateString()
					);
					const ordersTomorrow = ordersArr.filter(
						(item) => item.shortDate === shortDateTomorrow.toLocaleDateString()
					);

					if (ordersToday && ordersToday.length !== 0) {
						const pickup = [];

						const sortedOrdersToday = ordersToday.sort((a, b) => {
							return a.startTime - b.startTime;
						});

						for (let i = 0; i < sortedOrdersToday.length; i++) {
							const curr = sortedOrdersToday[i].pickupWindow;
							if (!pickup.includes(curr)) {
								pickup.push(curr);
							}
						}
						setIsOpen(true);
						setPickupWindowArr({ pickupToday: pickup });
						setLoadOrders((prev) => ({
							...prev,
							loadingOrders: false,
							hasOrdersToday: true,
							orderData: ordersArr,
							orderMessage: "",
						}));
					} else {
						setLoadOrders((prev) => ({
							...prev,
							loadingOrders: false,
							hasOrdersToday: false,
							orderData: ordersArr,
							orderMessage: "",
						}));
					}
					if (ordersTomorrow && ordersTomorrow.length !== 0) {
						const pickup = [];

						const sortedOrdersTomorrow = ordersTomorrow.sort((a, b) => {
							return a.startTime - b.startTime;
						});

						for (let i = 0; i < sortedOrdersTomorrow.length; i++) {
							const curr = sortedOrdersTomorrow[i].pickupWindow;
							if (!pickup.includes(curr)) {
								pickup.push(curr);
							}
						}
						setPickupWindowArr({ pickupTomorrow: pickup });
						setLoadOrders((prev) => ({
							...prev,
							loadingOrders: false,
							hasOrdersTomorrow: true,
							orderData: ordersArr,
							orderMessage: "",
						}));
					} else {
						setLoadOrders((prev) => ({
							...prev,
							loadingOrders: false,
							hasOrdersTomorrow: false,
							orderData: ordersArr,
							orderMessage: "",
						}));
					}
				}
			},
			(error) => {
				setLoadOrders((prev) => ({
					...prev,
					loadingOrders: false,
					orderData: [],
					hasOrdersToday: false,
					hasOrdersTomorrow: false,
					orderMessage: `Fetch orders failed: ${error}`,
				}));
			}
		);

		return unsub;
	}

	function getFlashSchedules(bizId) {
		const openHistoryRef = collection(db, "biz", bizId, "openHistory");

		const date = new Date();
		const shortDate = date.toLocaleDateString();

		const q = query(
			openHistoryRef,
			where("scheduledDateShort", "==", shortDate),
			where("status", "==", "Flash")
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

					setLoadPostsFlash((prev) => ({
						...prev,
						postDataFlash: schedArr,
						timeDisplaysFlash: timeDisplayArr,
						hasPostFlash: true,
						currShortDate: shortDate,
					}));
				} else {
					setLoadPostsFlash((prev) => ({
						...prev,
						hasPostFlash: false,
					}));
				}
			},
			(error) => {
				setLoadPostsFlash((prev) => ({
					...prev,
					hasPostFlash: false,
					postMessageFlash: `Error fetching flash posts: ${error}`,
				}));
			}
		);

		return unsubscribeFlash;
	}

	function getPosts(bizId) {
		setLoadPosts((prev) => ({
			...prev,
			loadingPosts: true,
		}));
		const shortDateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const shortDate = date.toLocaleDateString();
			shortDateArr.push(shortDate);
		}

		const collectionRef = collection(db, "biz", bizId, "openHistory");

		const q = query(
			collectionRef,
			where("scheduledDateShort", "in", shortDateArr),
			where("recurring", "==", false),
			where("status", "==", "Regular")
		);

		const unsubPostArr = onSnapshot(
			q,
			(querySnapshot) => {
				const postDataArr = [];
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					data.postId = doc.id;
					postDataArr.push(data);
				});
				if (postDataArr.length === 0) {
					setLoadPosts((prev) => ({
						...prev,
						loadingPosts: false,
						hasPostsToday: false,
						hasPostsTomorrow: false,
						postData: [],
						postMessage: "",
					}));
				} else {
					const shortDateToday = new Date();
					const shortDateTomorrow = new Date();
					shortDateTomorrow.setDate(shortDateTomorrow.getDate() + 1);

					const timeArr = postDataArr.map((item) => item.timeDisplay);
					const postsToday = postDataArr.filter(
						(item) =>
							item.scheduledDateShort === shortDateToday.toLocaleDateString()
					);
					const postsTomorrow = postDataArr.filter(
						(item) =>
							item.scheduledDateShort === shortDateTomorrow.toLocaleDateString()
					);

					if (postsToday && postsToday.length !== 0) {
						setLoadPosts((prev) => ({
							...prev,
							loadingPosts: false,
							hasPostsToday: true,
							postData: postDataArr,
							postMessage: "",
						}));
					} else {
						setLoadPosts((prev) => ({
							...prev,
							loadingPosts: false,
							hasPostsToday: false,
							postData: postDataArr,
							postMessage: "",
						}));
					}
					if (postsTomorrow && postsTomorrow.length !== 0) {
						setLoadPosts((prev) => ({
							...prev,
							loadingPosts: false,
							hasPostsTomorrow: true,
							postData: postDataArr,
							postMessage: "",
						}));
					} else {
						setLoadPosts((prev) => ({
							...prev,
							loadingPosts: false,
							hasPostsTomorrow: false,
							postData: postDataArr,
							postMessage: "",
						}));
					}
				}
			},
			(error) => {
				setLoadPosts((prev) => ({
					...prev,
					loadingPosts: false,
					hasPostsToday: false,
					hasPostsTomorrow: false,
					postData: [],
					postMessage: `Error getting schedules: ${error}`,
				}));
			}
		);

		return unsubPostArr;
	}

	function getPostsRecur(bizId) {
		setLoadPostsRecur((prev) => ({
			...prev,
			loadingPosts: true,
		}));
		const shortDateArr = [];
		const dayOfWeekArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const shortDate = date.toLocaleDateString();
			const dayOfWk = date.getDay();
			shortDateArr.push(shortDate);

			switch (dayOfWk) {
				case 0:
					dayOfWeekArr.push("Sun");
					break;
				case 1:
					dayOfWeekArr.push("Mon");
					break;
				case 2:
					dayOfWeekArr.push("Tue");
					break;
				case 3:
					dayOfWeekArr.push("Wed");
					break;
				case 4:
					dayOfWeekArr.push("Thur");
					break;
				case 5:
					dayOfWeekArr.push("Fri");
					break;
				case 6:
					dayOfWeekArr.push("Sat");
					break;

				default:
					break;
			}
		}

		const collectionRef = collection(db, "biz", bizId, "openHistory");

		const qRecur = query(
			collectionRef,
			where("dayOfWeek", "in", dayOfWeekArr),
			where("recurring", "==", true)
		);

		const unsubPostArrRecur = onSnapshot(
			qRecur,
			(querySnapshot) => {
				const postDataArr = [];
				querySnapshot.forEach((doc) => {
					const data = doc.data();
					data.postId = doc.id;
					postDataArr.push(data);
				});
				if (postDataArr.length === 0) {
					setLoadPostsRecur((prev) => ({
						...prev,
						loadingPostsRecur: false,
						hasPostsRecurToday: false,
						hasPostsRecurTomorrow: false,
						postMessageRecur: "",
						postDataRecur: [],
					}));
				} else {
					const recurTimeArr = postDataArr.map((item) => item.timeDisplay);
					const postsToday = postDataArr.filter(
						(item) => item.dayOfWeek === dayOfWeekArr[0]
					);
					const postsTomorrow = postDataArr.filter(
						(item) => item.dayOfWeek === dayOfWeekArr[1]
					);

					if (postsToday && postsToday.length !== 0) {
						setLoadPostsRecur((prev) => ({
							...prev,
							loadingPostsRecur: false,
							hasPostsRecurToday: true,
							postDataRecur: postDataArr,
							postMessageRecur: "",
						}));
					} else {
						setLoadPostsRecur((prev) => ({
							...prev,
							loadingPostsRecur: false,
							hasPostsRecurToday: false,
							postDataRecur: postDataArr,
							postMessageRecur: "",
						}));
					}

					if (postsTomorrow && postsTomorrow.length !== 0) {
						setLoadPostsRecur((prev) => ({
							...prev,
							loadingPostsRecur: false,
							hasPostsRecurTomorrow: true,
							postDataRecur: postDataArr,
							postMessageRecur: "",
						}));
					} else {
						setLoadPostsRecur((prev) => ({
							...prev,
							loadingPostsRecur: false,
							hasPostsRecurTomorrow: false,
							postDataRecur: postDataArr,
							postMessageRecur: "",
						}));
					}
				}
			},
			(error) => {
				setLoadPostsRecur((prev) => ({
					...prev,
					loadingPostsRecur: false,
					hasPostsRecurToday: false,
					hasPostsRecurTomorrow: false,
					postDataRecur: [],
					postMessageRecur: `Error getting schedules: ${error}`,
				}));
			}
		);

		return unsubPostArrRecur;
	}

	async function getPostsOrdersCount(bizIdTemp) {
		const docRef = doc(db, "biz", bizIdTemp);

		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			const data = docSnap.data();
			const numPosts = data.numSchedules;
			const numOrders = data.numOrders;
			const totalRevenue = data.totalRevenue;
			setLoadOrders((prev) => ({
				...prev,
				ordersCount: numOrders,
				totalRevenue: totalRevenue,
			}));
			setLoadPosts((prev) => ({
				...prev,
				postsCount: numPosts,
			}));
		} else {
			setLoadOrders((prev) => ({
				...prev,
				orderMessage: `Error getting number of orders: ${error}`,
			}));
			setLoadPosts((prev) => ({
				...prev,
				postMessage: `Error getting number of posts: ${error}`,
			}));
		}
	}

	function loadDates() {
		const datesArray = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const dateConcat = month + "/" + day;
			const dayOfWk = date.getDay();
			let tempData = {};
			tempData.monthDay = dateConcat;
			tempData.actualDate = date.toDateString();
			tempData.dayOfWkIdx = dayOfWk + 1;
			tempData.statusTodayOrTomorrow = i;
			tempData.shortDate = date.toLocaleDateString();

			switch (dayOfWk) {
				case 0:
					tempData.dayOfWeek = "Sunday";
					tempData.dayOfWeekShort = "Sun";
					break;
				case 1:
					tempData.dayOfWeek = "Monday";
					tempData.dayOfWeekShort = "Mon";
					break;
				case 2:
					tempData.dayOfWeek = "Tuesday";
					tempData.dayOfWeekShort = "Tue";
					break;
				case 3:
					tempData.dayOfWeek = "Wednesday";
					tempData.dayOfWeekShort = "Wed";
					break;
				case 4:
					tempData.dayOfWeek = "Thursday";
					tempData.dayOfWeekShort = "Thur";
					break;
				case 5:
					tempData.dayOfWeek = "Friday";
					tempData.dayOfWeekShort = "Fri";
					break;
				case 6:
					tempData.dayOfWeek = "Saturday";
					tempData.dayOfWeekShort = "Sat";
					break;

				default:
					break;
			}

			datesArray.push(tempData);
		}

		setTwoDays(datesArray);
	}

	// * Actions -----------------------------------------------------

	function handleClick(e) {
		const { name } = e.target;

		if (name === "create") {
			router.push(`/dashboard/${uid}/schedule`);
		}
		if (name === "view") {
			router.push(`/dashboard/${uid}/orders/incoming-orders`);
		}
	}

	return (
		<Layout currentPage="Dashboard" uid={uid}>
			<div className={styles.Dashboard}>
				<div className={styles.Dashboard__stats}>
					<div className={styles.Dashboard__statsBox}>
						<h5>Posts:</h5>
						<div>
							<Image
								loader={MyLoader}
								src="https://img.icons8.com/stickers/50/000000/planner.png"
								width="25px"
								height="25px"
								alt="planner icon"
							/>
							<h1>{postsCount}</h1>
						</div>
					</div>
					<div className={styles.Dashboard__statsBox}>
						<h5>Orders:</h5>
						<div>
							<Image
								loader={MyLoader}
								src="https://img.icons8.com/stickers/50/000000/check.png"
								width="25px"
								height="25px"
								alt="order icon"
							/>
							<h1>{ordersCount}</h1>
						</div>
					</div>
					<div className={styles.Dashboard__statsBox}>
						<h5>Sales:</h5>
						<div>
							<Image
								loader={MyLoader}
								src="https://img.icons8.com/stickers/50/000000/filled-filter.png"
								width="25px"
								height="25px"
								alt="money icon"
							/>
							<h1>${totalRevenue}</h1>
						</div>
					</div>
					{statusMessage && (
						<Grid item xs={12} md={6}>
							<Collapse in={isAlertOpen}>
								<Alert severity="info">
									{" "}
									<AlertTitle>Info</AlertTitle>
									{statusMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{error && (
						<Grid item xs={12} md={6}>
							<Collapse in={isAlertOpen}>
								<Alert
									severity="error"
									onClose={() => {
										setIsAlertOpen(false);
									}}
								>
									{error}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{/* {status === 1 && (
						<Grid item xs={12} md={6}>
							<Collapse in={isOpen}>
								<Alert severity="info">
									Pending orders not accepted by the end of the day will be
									automatically declined.
								</Alert>
							</Collapse>
						</Grid>
					)} */}
					{postMessageRecur && (
						<Grid item xs={12} md={4}>
							<Collapse in={isOpen}>
								<Alert severity="error">
									<AlertTitle>Error</AlertTitle>
									{postMessageRecur}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{postMessage && (
						<Grid item xs={12} md={4}>
							<Collapse in={isOpen}>
								<Alert severity="error">
									<AlertTitle>Error</AlertTitle>
									{postMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{orderMessage && (
						<Grid item xs={12} md={4}>
							<Collapse in={isOpen}>
								<Alert severity="error">
									<AlertTitle>Error</AlertTitle>
									{orderMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
				</div>
				<div className={styles.Dashboard__notifications}>
					<div className={styles.Dashboard__notificationsContainer}>
						<div className={styles.Dashboard__notificationsHeader}>
							<h3>Orders</h3>
							<Button
								variant="contained"
								size="small"
								onClick={handleClick}
								name="view"
							>
								View Orders
							</Button>
						</div>

						<div className={styles.Dashboard__notificationsBody}>
							<div className={styles.Dashboard__notificationsBodyDetail}>
								<div className={styles.Dashboard__notificationsBodyHead}>
									{twoDays[0].statusTodayOrTomorrow === 0 ? (
										<h4>Today</h4>
									) : (
										<h4 style={{ visibility: "hidden" }}>Today</h4>
									)}
									<h5>{twoDays[0].dayOfWeek}</h5>
									<p>{twoDays[0].monthDay}</p>
								</div>
								<div className={styles.Dashboard__notificationsBodyContainer}>
									{hasOrdersToday ? (
										pickupToday.map((pickup, idx) => {
											return (
												<div
													key={idx}
													className={styles.Dashboard__notificationsOrderGroup}
												>
													<p>{pickup}</p>
													{orderData.map((order, index) => {
														if (
															order.shortDate === twoDays[0].shortDate &&
															order.pickupWindow === pickup
														) {
															return (
																<div
																	key={order.orderId}
																	className={
																		styles.Dashboard__notificationsBodyOrderList
																	}
																	style={statusBordersOrders(order.status)}
																>
																	<p style={statusStyle(order.status)}>
																		{order.status === "Reserved"
																			? "Pending"
																			: order.status}
																	</p>
																	<p>{order.customerName}</p>

																	<p className={styles.Dashboard__orderCount}>
																		{order.items[0].quantity}x
																	</p>
																	<p>{order.items[0].itemName}</p>
																</div>
															);
														}
													})}
												</div>
											);
										})
									) : (
										<p
											className={
												styles.Dashboard__notificationsBodyScheduleListEmpty
											}
										>
											No orders
										</p>
									)}
								</div>
							</div>
							<div className={styles.Dashboard__notificationsBodyDetail}>
								<div className={styles.Dashboard__notificationsBodyHead}>
									{twoDays[1] && twoDays[1].statusTodayOrTomorrow === 1 ? (
										<h4>Tomorrow</h4>
									) : (
										<h5 style={{ visibility: "hidden" }}>Today</h5>
									)}
									<h5>{twoDays[1] && twoDays[1].dayOfWeek}</h5>
									<p>{twoDays[1] && twoDays[1].monthDay}</p>
								</div>
								<div className={styles.Dashboard__notificationsBodyContainer}>
									{hasOrdersTomorrow ? (
										pickupTomorrow.map((pickup, idx) => {
											return (
												<div
													key={idx}
													className={styles.Dashboard__notificationsOrderGroup}
												>
													<p>{pickup}</p>
													{orderData.map((order, index) => {
														if (
															order.shortDate === twoDays[1].shortDate &&
															order.pickupWindow === pickup
														) {
															return (
																<div
																	key={order.orderId}
																	className={
																		styles.Dashboard__notificationsBodyOrderList
																	}
																	style={statusBordersOrders(order.status)}
																>
																	<p>{order.pickupWindow}</p>

																	<p>{order.customerName}</p>

																	<p style={statusStyle(order.status)}>
																		{order.status === "Reserved"
																			? "Pending"
																			: order.status}
																	</p>

																	<p className={styles.Dashboard__orderCount}>
																		{order.items[0].quantity}x
																	</p>
																	<p>{order.items[0].itemName}</p>
																</div>
															);
														}
													})}
												</div>
											);
										})
									) : (
										<p
											className={
												styles.Dashboard__notificationsBodyScheduleListEmpty
											}
										>
											No orders
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
					<div className={styles.Dashboard__notificationsContainer}>
						<div className={styles.Dashboard__notificationsHeader}>
							<h3>Scheduled Posts</h3>
							<Button
								variant="contained"
								size="small"
								onClick={handleClick}
								name="create"
							>
								+ Create
							</Button>
						</div>

						<div className={styles.Dashboard__notificationsBody}>
							<div className={styles.Dashboard__notificationsBodyDetail}>
								<div className={styles.Dashboard__notificationsBodyHead}>
									{twoDays[0].statusTodayOrTomorrow === 0 ? (
										<h4>Today</h4>
									) : (
										<h5 style={{ visibility: "hidden" }}>Today</h5>
									)}
									<h5>{twoDays[0].dayOfWeek}</h5>
									<p>{twoDays[0].monthDay}</p>
								</div>
								<div className={styles.Dashboard__notificationsBodyContainer}>
									{currShortDate === twoDays[0].shortDate ? (
										<div className={styles.Dashboard__postFlash}>
											{postMessageFlash ? (
												<p>{postMessageFlash}</p>
											) : hasPostFlash ? (
												timeDisplaysFlash
													.sort((a, b) => {
														if (a.hourStart === b.hourStart) {
															return a.minStart - b.minStart;
														} else {
															return a.hourStart - b.hourStart;
														}
													})
													.map((time, idx) => {
														return (
															<div
																key={time.startTime}
																className={styles.Dashboard__notificationsFlash}
															>
																<p>{time.timeDisplay}</p>
																{postDataFlash.map((flash, i) => {
																	if (flash.timeDisplay === time.timeDisplay) {
																		return (
																			<div
																				key={flash.id}
																				className={
																					styles.Dashboard__notificationsBodyScheduleList
																				}
																				style={statusBordersPostsFlash(
																					flash.numAvailable
																				)}
																			>
																				<p
																					className={
																						styles.Dashboard__notificationsBodyScheduleListStatus
																					}
																					style={{
																						color: "white",
																						backgroundColor:
																							flash.numAvailable > 0
																								? "var(--flash)"
																								: "var(--light-red)",
																					}}
																				>
																					{flash.numAvailable > 0
																						? "Flash"
																						: "Sold out"}
																				</p>
																				<div
																					style={{
																						display: "flex",
																						alignItems: "center",
																						gap: "5px",
																					}}
																				>
																					<p
																						className={
																							styles.Dashboard__orderCount
																						}
																					>
																						{flash.numAvailable}x
																					</p>
																					<p>{flash.itemName}</p>
																				</div>
																				<p>{flash.itemPrice}</p>
																				{flash.recurring ? (
																					<p
																						style={{
																							color: "var(--dark-blue)",
																						}}
																					>
																						RECUR
																					</p>
																				) : (
																					<p
																						style={{
																							color: "var(--dark-blue)",
																							textDecoration: "line-through",
																						}}
																					>
																						RECUR
																					</p>
																				)}
																			</div>
																		);
																	}
																})}
															</div>
														);
													})
											) : (
												<p style={{ display: "none" }}>No Flash</p>
											)}
										</div>
									) : (
										<p style={{ display: "none" }}>No Flash</p>
									)}
									{hasPostsToday || hasPostsRecurToday ? (
										postData
											.concat(postDataRecur)
											.sort((a, b) => {
												if (a.hourStart === b.hourStart) {
													return a.minStart - b.minStart;
												} else {
													return a.hourStart - b.hourStart;
												}
											})
											.map((item, index) => {
												if (item.dayOfWeek === twoDays[0].dayOfWeekShort) {
													return (
														<div
															key={item.startTime}
															className={
																styles.Dashboard__notificationsOrderGroup
															}
														>
															{" "}
															<p>{item.timeDisplay}</p>
															{postData
																.concat(postDataRecur)
																.map((post, idx) => {
																	if (
																		post.dayOfWeek ===
																			twoDays[0].dayOfWeekShort &&
																		post.timeDisplay === item.timeDisplay
																	) {
																		return (
																			<div
																				key={post.endTime}
																				className={
																					styles.Dashboard__notificationsBodyScheduleList
																				}
																				style={statusBordersPosts(
																					post.numAvailable
																				)}
																			>
																				<p
																					className={
																						styles.Dashboard__notificationsBodyScheduleListStatus
																					}
																					style={{
																						color: "white",
																						backgroundColor:
																							post.numAvailable > 0
																								? "var(--light-green)"
																								: "var(--light-red)",
																					}}
																				>
																					{post.numAvailable > 0
																						? "Live"
																						: "Sold out"}
																				</p>
																				<div
																					style={{
																						display: "flex",
																						alignItems: "center",
																						gap: "5px",
																					}}
																				>
																					<p
																						className={
																							styles.Dashboard__orderCount
																						}
																					>
																						{post.numAvailable}x
																					</p>
																					<p>{post.itemName}</p>
																				</div>
																				<p>{post.itemPrice}</p>
																				{post.recurring ? (
																					<p
																						style={{
																							color: "var(--dark-blue)",
																						}}
																					>
																						RECUR
																					</p>
																				) : (
																					<p
																						style={{
																							color: "var(--dark-blue)",
																							textDecoration: "line-through",
																						}}
																					>
																						RECUR
																					</p>
																				)}
																			</div>
																		);
																	}
																})}
														</div>
													);
												}
											})
									) : (
										<p
											className={
												styles.Dashboard__notificationsBodyScheduleListEmpty
											}
										>
											No scheduled posts
										</p>
									)}
								</div>
							</div>

							<div className={styles.Dashboard__notificationsBodyDetail}>
								<div className={styles.Dashboard__notificationsBodyHead}>
									{twoDays[1] && twoDays[1].statusTodayOrTomorrow === 1 ? (
										<h4>Tomorrow</h4>
									) : (
										<h5 style={{ visibility: "hidden" }}>Today</h5>
									)}
									<h5>{twoDays[1] && twoDays[1].dayOfWeek}</h5>
									<p>{twoDays[1] && twoDays[1].monthDay}</p>
								</div>
								<div className={styles.Dashboard__notificationsBodyContainer}>
									{hasPostsTomorrow || hasPostsRecurTomorrow ? (
										postData
											.concat(postDataRecur)
											.sort((a, b) => {
												if (a.hourStart === b.hourStart) {
													return a.minStart - b.minStart;
												} else {
													return a.hourStart - b.hourStart;
												}
											})
											.map((item, index) => {
												if (item.dayOfWeek === twoDays[1].dayOfWeekShort) {
													return (
														<div
															key={item.startTime}
															className={
																styles.Dashboard__notificationsOrderGroup
															}
														>
															{" "}
															<p>{item.timeDisplay}</p>
															{postData
																.concat(postDataRecur)
																.map((post, idx) => {
																	if (
																		post.dayOfWeek ===
																			twoDays[1].dayOfWeekShort &&
																		post.timeDisplay === item.timeDisplay
																	) {
																		return (
																			<div
																				key={post.endTime}
																				className={
																					styles.Dashboard__notificationsBodyScheduleList
																				}
																				style={statusBordersPosts(
																					post.numAvailable
																				)}
																			>
																				<p
																					className={
																						styles.Dashboard__notificationsBodyScheduleListStatus
																					}
																					style={{
																						color: "white",
																						backgroundColor:
																							post.numAvailable > 0
																								? "var(--light-green)"
																								: "var(--light-red)",
																					}}
																				>
																					{post.numAvailable > 0
																						? "Live"
																						: "Sold out"}
																				</p>
																				<p>{post.timeDisplay}</p>
																				<div
																					style={{
																						display: "flex",
																						alignItems: "center",
																						gap: "5px",
																					}}
																				>
																					<p
																						className={
																							styles.Dashboard__orderCount
																						}
																					>
																						{post.numAvailable}x
																					</p>
																					<p>{post.itemName}</p>
																				</div>

																				<p>{post.itemPrice}</p>
																				{post.recurring && (
																					<p
																						style={{
																							color: "var(--gray)",
																							fontSize: "10px",
																						}}
																					>
																						RECUR
																					</p>
																				)}
																			</div>
																		);
																	}
																})}
														</div>
													);
												}
											})
									) : (
										<p
											className={
												styles.Dashboard__notificationsBodyScheduleListEmpty
											}
										>
											No scheduled posts
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default Dashboard;
