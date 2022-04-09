import React, { useState, useEffect, forwardRef } from "react";
import Layout from "../../../../Components/Layout";
import {
	getOrderHistory,
	getSearchOrderHistory,
} from "../../../../actions/dashboard/ordersCrud";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/orders-history.module.css";
import OrderHistoryTabComponent from "../../../../Components/Dashboard/Orders/history/OrderHistoryTabComponent";
import { IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { CircularProgress } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { getLocalStorage } from "../../../../actions/auth/auth";
import { Button } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function HistoryOrders() {
	const [isSearchData, setIsSearchData] = useState(false);
	const [orders, setOrders] = useState([]);
	const [prevDoc, setPrevDoc] = useState();
	const [lastDoc, setLastDoc] = useState();
	const [pageCount, setPageCount] = useState(1);
	const [nextDisabled, setNextDisabled] = useState(false);
	const [lastPage, setLastPage] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedDates, setSelectedDates] = useState({
		startDate: null,
		endDate: new Date(),
	});
	const [loadOrder, setLoadOrder] = useState({
		loading: false,
		message: "",
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [sort, setSort] = useState({
		orderId: "asc",
		date: "asc",
		custName: "asc",
		itemName: "asc",
		quantity: "asc",
		total: "asc",
		status: "asc",
	});
	const { startDate, endDate } = selectedDates;
	const { storedUser, bizId } = user;
	const { loading, message } = loadOrder;
	const { orderId, date, custName, itemName, quantity, total, status } = sort;

	const router = useRouter();
	const uid = router.query.uid;

	// eslint-disable-next-line react/display-name
	const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
		<Button
			variant="contained"
			size="small"
			sx={{
				backgroundColor: "var(--light-btn-blue)",
				width: "fit-content",
				fontSize: " 14px",
			}}
			// className={styles.DateButton}
			onClick={onClick}
			ref={ref}
		>
			{value}
		</Button>
	));

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

		loadOrders(bizIdTemp);
	}, [uid]);

	// * UseEffect Actions ----------------------------------------------
	async function loadOrders(bizIdTemp) {
		setLoadOrder({ loading: true, message: "" });
		const resOrders = await getOrderHistory(bizIdTemp, "first");
		if (resOrders.success) {
			if (!resOrders.ordersArr || resOrders.ordersArr.length === 0) {
				setLoadOrder({ loading: false, message: "" });
			} else {
				const last = resOrders.lastDocu;

				setOrders(resOrders.ordersArr);
				setLoadOrder({ loading: false, message: "" });
				setLastDoc(last);
			}
		} else {
			setLoadOrder({ loading: false, message: resOrders.message });
		}
	}

	// * Actions ----------------------------------------------

	function handleSort(name) {
		if (name === "status") {
			if (status === "asc") {
				setOrders((prev) =>
					prev.sort((a, b) => {
						const idA = a.status.toUpperCase();
						const idB = b.status.toUpperCase();
						if (idA < idB) {
							return -1;
						}

						if (idA > idB) {
							return 1;
						}
						if (idA === idB) {
							return 0;
						}
					})
				);
				setSort((prev) => ({ ...prev, status: "desc" }));
			} else {
				setOrders((prev) =>
					prev.sort((a, b) => {
						const idA = a.status.toUpperCase();
						const idB = b.status.toUpperCase();
						if (idA < idB) {
							return 1;
						}

						if (idA > idB) {
							return -1;
						}
						if (idA === idB) {
							return 0;
						}
					})
				);
				setSort((prev) => ({ ...prev, status: "asc" }));
			}
		}
	}

	async function handlePaginationClick(e) {
		setLoadOrder({ loading: true, message: "" });

		const { name } = e.target;
		const startDateEpoch = Date.parse(startDate);
		endDate.setHours(23, 59, 59, 999);
		const endDateEpoch = Date.parse(endDate);

		if (name === "prev") {
			if (isSearchData) {
				setNextDisabled(false);
				setLastPage(false);
				let resOrders;

				if (lastPage) {
					resOrders = await getSearchOrderHistory(
						bizId,
						"last",
						lastDoc,
						startDateEpoch,
						endDateEpoch
					);
				} else {
					resOrders = await getSearchOrderHistory(
						bizId,
						name,
						prevDoc,
						startDateEpoch,
						endDateEpoch
					);
				}

				if (resOrders.success) {
					const last = resOrders.lastDocu;
					const prev = resOrders.prevDocu;

					setOrders(resOrders.sortedOrdersArr);
					setLoadOrder({ loading: false, message: "" });
					setLastDoc(last);
					setPrevDoc(prev);
					setPageCount((prev) => prev - 1);
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			} else {
				setNextDisabled(false);
				setLastPage(false);
				let resOrders;

				if (lastPage) {
					resOrders = await getOrderHistory(bizId, "last", lastDoc);
				} else {
					resOrders = await getOrderHistory(bizId, name, prevDoc);
				}

				if (resOrders.success) {
					const prev = resOrders.prevDocu;
					const last = resOrders.lastDocu;

					setOrders(resOrders.ordersArr);
					setLoadOrder({ loading: false, message: "" });
					setLastDoc(last);
					setPrevDoc(prev);
					setPageCount((prev) => prev - 1);
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			}
		}

		if (name === "next") {
			if (isSearchData) {
				const resOrders = await getSearchOrderHistory(
					bizId,
					name,
					lastDoc,
					startDateEpoch,
					endDateEpoch
				);
				if (resOrders.success) {
					const resOrderLen = resOrders.sortedOrdersArr.length;
					if (resOrderLen !== 0) {
						const last = resOrders.lastDocu;
						const prev = resOrders.prevDocu;
						setOrders(resOrders.sortedOrdersArr);
						setLoadOrder({ loading: false, message: "" });
						setLastDoc(last);
						setPrevDoc(prev);
						setPageCount((prev) => prev + 1);
					} else {
						setLoadOrder({ loading: false, message: "No more orders." });
						setNextDisabled(true);
						setPageCount((prev) => prev + 1);
						setLastPage(true);
					}
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			} else {
				const resOrders = await getOrderHistory(bizId, name, lastDoc);
				if (resOrders.success) {
					const resOrdLen = resOrders.ordersArr.length;
					if (resOrdLen !== 0) {
						const prev = resOrders.prevDocu;
						const last = resOrders.lastDocu;

						setOrders(resOrders.ordersArr);
						setLoadOrder({ loading: false, message: "" });
						setLastDoc(last);
						setPrevDoc(prev);
						setPageCount((prev) => prev + 1);
					} else {
						setLoadOrder({ loading: false, message: "No more orders." });
						setNextDisabled(true);
						setPageCount((prev) => prev + 1);
						setLastPage(true);
					}
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			}
		}
	}

	async function handleSearchClick(e) {
		setLoadOrder({ loading: true, message: "" });
		const startDateEpoch = Date.parse(startDate);
		endDate.setHours(23, 59, 59, 999);
		const endDateEpoch = Date.parse(endDate);

		if (!startDate || !endDate) {
			// TODO: handle error, must have a date selected
			return;
		}

		if (startDate > endDate) {
			// TODO: handle error, please select startdate before x, or enddate after y.
			return;
		}

		let resOrders = await getSearchOrderHistory(
			bizId,
			"first",
			null,
			startDateEpoch,
			endDateEpoch
		);

		if (resOrders.success) {
			const ordersLen = resOrders.sortedOrdersArr.length;

			if (ordersLen !== 0) {
				const last = resOrders.lastDocu;

				setOrders(resOrders.sortedOrdersArr);
				setLastDoc(last);
				setIsSearchData(true);
				setLoadOrder({ loading: false, message: "" });
			} else {
				// TODO: handle error, could not fetch results
				setLoadOrder({ loading: false, message: resOrders.message });
			}
		}
	}

	return (
		<Layout uid={uid} currentPage="Orders" subPage="orders-history">
			<div className={styles.HistoryOrders}>
				<div className={styles.HistoryOrders__main}>
					<div className={styles.SearchGroup}>
						<div className={styles.DatePickerContainer}>
							<div className={styles.DateGroup}>
								<p>From:</p>
								<DatePicker
									selected={startDate}
									onChange={(date) =>
										setSelectedDates((prev) => ({ ...prev, startDate: date }))
									}
									customInput={<ExampleCustomInput />}
								/>
							</div>
							<div className={styles.DateGroup}>
								<p>To:</p>
								<DatePicker
									selected={endDate}
									onChange={(date) =>
										setSelectedDates((prev) => ({ ...prev, endDate: date }))
									}
									customInput={<ExampleCustomInput />}
								/>
							</div>
						</div>

						<Button
							variant="contained"
							size="small"
							sx={{
								backgroundColor: "var(--btn-blue)",
								height: "fit-content",
								fontSize: "14px",
							}}
							onClick={handleSearchClick}
						>
							Search
						</Button>
					</div>

					<div className={styles.HistoryOrders__orderHeader}>
						<div className={`${styles.justifyStartItem} ${styles.paddingLeft}`}>
							<h5>#ID</h5>
						</div>
						<div className={styles.justifyEndItem}>
							<h5>Date</h5>
						</div>
						<div className={styles.justifyStartItem}>
							<h5>Name</h5>
						</div>
						<div>
							<h5>Item</h5>
						</div>
						<div className={styles.justifyEndItem}>
							<h5>Quantity</h5>
						</div>
						<div className={styles.justifyStartItem}>
							<h5>Total</h5>
						</div>
						<div className={`${styles.flex} ${styles.justifyCenter}`}>
							<h5>Status</h5>
							<IconButton onClick={() => handleSort("status")}>
								<ArrowDropDownIcon />
							</IconButton>
						</div>
					</div>
					<div className={styles.HistoryOrders__orderBody}>
						{loading ? (
							<CircularProgress />
						) : message ? (
							<p style={{ textAlign: "center", margin: "0 auto" }}>{message}</p>
						) : orders.length === 0 ? (
							<p
								style={{
									textAlign: "center",
									margin: "40px auto",
									color: "var(--gray)",
									fontSize: "12px",
								}}
							>
								No order history
							</p>
						) : (
							orders.map((order, index) => {
								return (
									<OrderHistoryTabComponent key={order.orderId} order={order} />
								);
							})
						)}
						<div className={styles.HistoryOrders__paginationButton}>
							<Button
								name="prev"
								onClick={handlePaginationClick}
								disabled={pageCount === 1}
							>
								prev
							</Button>
							<Button
								name="next"
								onClick={handlePaginationClick}
								disabled={
									nextDisabled ? true : orders.length === 10 ? false : true
								}
							>
								next
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default HistoryOrders;
