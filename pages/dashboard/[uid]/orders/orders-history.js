import React, { useState, useEffect } from "react";
import Layout from "../../../../Components/Layout";
import {
	getOrderHistory,
	getSearchOrderHistory,
} from "../../../../actions/dashboard/ordersCrud";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/orders-history.module.css";
import OrderHistoryTabComponent from "../../../../Components/Dashboard/Orders/OrderHistoryTabComponent";
import { IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { CircularProgress } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { getLocalStorage } from "../../../../actions/auth/auth";
import { Button } from "@mui/material";

function HistoryOrders() {
	const [isSearchData, setIsSearchData] = useState(false);
	const [orders, setOrders] = useState([]);
	const [prevDoc, setPrevDoc] = useState();
	const [lastDoc, setLastDoc] = useState();
	const [pageCount, setPageCount] = useState(1);
	const [nextDisabled, setNextDisabled] = useState(false);
	const [lastPage, setLastPage] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusQuery, setStatusQuery] = useState([]);
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

	const { storedUser, bizId } = user;
	const { loading, message } = loadOrder;
	const { orderId, date, custName, itemName, quantity, total, status } = sort;

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

	async function handleSearchClick(e) {
		setLoadOrder({ loading: true, message: "" });

		const lowerCaseSearch = _.toLower(searchQuery);

		if (!searchQuery && statusQuery.length === 0) {
			loadOrders(bizId);
			setIsSearchData(false);
			return;
		} else {
			setIsSearchData(true);
		}

		// * Search order keywords only
		if (searchQuery && statusQuery.length === 0) {
			const resSearch = await getSearchOrderHistory(
				bizId,
				lowerCaseSearch,
				null,
				"first",
				null
			);

			if (resSearch.success) {
				if (
					!resSearch.sortedOrdersArr ||
					resSearch.sortedOrdersArr.length === 0
				) {
					setLoadOrder({ loading: false, message: "" });
				} else {
					const last = resSearch.lastDocu;
					setOrders(resSearch.sortedOrdersArr);
					setLoadOrder({ loading: false, message: "" });
					setLastDoc(last);
				}
			} else {
				setLoadOrder({ loading: false, message: resSearch.message });
			}
		}

		// * Search order status only
		if (!searchQuery && statusQuery.length !== 0) {
			const resSearch = await getSearchOrderHistory(
				bizId,
				null,
				statusQuery,
				"first",
				null
			);

			if (resSearch.success) {
				if (
					!resSearch.sortedOrdersArr ||
					resSearch.sortedOrdersArr.length === 0
				) {
					setLoadOrder({ loading: false, message: "" });
				} else {
					const last = resSearch.lastDocu;
					setOrders(resSearch.sortedOrdersArr);
					setLoadOrder({ loading: false, message: "" });
					setLastDoc(last);
				}
			} else {
				setLoadOrder({ loading: false, message: resSearch.message });
			}
		}

		// * Search order keywords & Status
		if (searchQuery && statusQuery.length !== 0) {
			const resSearch = await getSearchOrderHistory(
				bizId,
				lowerCaseSearch,
				statusQuery,
				"first",
				null
			);

			if (resSearch.success) {
				if (
					!resSearch.sortedOrdersArr ||
					resSearch.sortedOrdersArr.length === 0
				) {
					setOrders([]);
					setLoadOrder({ loading: false, message: "" });
				} else {
					const last = resSearch.lastDocu;
					setOrders(resSearch.sortedOrdersArr);
					setLoadOrder({ loading: false, message: "" });
					setLastDoc(last);
				}
			} else {
				setLoadOrder({ loading: false, message: resSearch.message });
			}
		}
	}

	function handleChange(e) {
		const { target } = e;
		const name = target.name;
		const value = target.value;
		const isChecked = target.checked;

		if (name === "search") {
			setSearchQuery(value);
		} else {
			if (statusQuery.length === 0) {
				if (isChecked) {
					setStatusQuery((prev) => [...prev, name]);
				}
			} else {
				const containsStatus = statusQuery.includes(name);
				if (isChecked) {
					if (!containsStatus) {
						setStatusQuery((prev) => [...prev, name]);
					}
				} else {
					if (containsStatus) {
						setStatusQuery((prev) => prev.filter((index) => index !== name));
					}
				}
			}
		}
	}

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

		if (name === "prev") {
			if (isSearchData) {
				setNextDisabled(false);
				setLastPage(false);
				let resOrders;

				if (lastPage) {
					resOrders = await getSearchOrderHistory(
						bizId,
						searchQuery,
						statusQuery,
						"last",
						prevDoc
					);
				} else {
					resOrders = await getSearchOrderHistory(
						bizId,
						searchQuery,
						statusQuery,
						name,
						prevDoc
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
					resOrders = await getOrderHistory(bizId, "last", prevDoc);
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
					searchQuery,
					statusQuery,
					name,
					lastDoc
				);
				if (resOrders.success) {
					const last = resOrders.lastDocu;
					const prev = resOrders.prevDocu;
					if (resOrders.sortedOrdersArr.length !== 0) {
						setOrders(resOrders.sortedOrdersArr);
						setLoadOrder({ loading: false, message: "" });
						setLastDoc(last);
						setPrevDoc(prev);
						setPageCount((prev) => prev + 1);
					} else {
						setLoadOrder({ loading: false, message: "No more orders." });
						setNextDisabled(true);
						setPageCount((prev) => prev + 1);
						setPrevDoc(last);
						setLastPage(true);
					}
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			} else {
				const resOrders = await getOrderHistory(bizId, name, lastDoc);
				if (resOrders.success) {
					if (resOrders.ordersArr.length !== 0) {
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
						setPrevDoc(lastDoc);
						setLastPage(true);
					}
				} else {
					setLoadOrder({ loading: false, message: resOrders.message });
				}
			}
		}
	}

	return (
		<Layout uid={uid} currentPage="Orders" subPage="orders-history">
			<div className={styles.HistoryOrders}>
				<div className={styles.HistoryOrders__statusQuery}>
					<div className={styles.Orders__filtersItemContainer}>
						<h3>Status:</h3>
						<div>
							<div>
								<input
									type="checkbox"
									id="reserved"
									name="Reserved"
									onChange={handleChange}
								/>
								<label htmlFor="reserved">Reserved</label>
							</div>
							<div>
								<input
									type="checkbox"
									id="confirmed"
									name="Confirmed"
									onChange={handleChange}
								/>
								<label htmlFor="confirmed">Confirmed</label>
							</div>
							<div>
								<input
									type="checkbox"
									id="completed"
									name="Completed"
									onChange={handleChange}
								/>
								<label htmlFor="completed">Completed</label>
							</div>
							<div>
								<input
									type="checkbox"
									id="declined"
									name="Declined"
									onChange={handleChange}
								/>
								<label htmlFor="declined">Declined</label>
							</div>
							<div>
								<input
									type="checkbox"
									id="cancelled"
									name="Cancelled"
									onChange={handleChange}
								/>
								<label htmlFor="cancelled">Cancelled</label>
							</div>
							<div>
								<input
									type="checkbox"
									id="no-show"
									name="No Show"
									onChange={handleChange}
								/>
								<label htmlFor="no-show">No Show</label>
							</div>
						</div>
					</div>
				</div>
				<div className={styles.HistoryOrders__main}>
					<div className={styles.HistoryOrders__searchBar}>
						<input
							type="text"
							placeholder="Search"
							name="search"
							value={searchQuery}
							onChange={handleChange}
						/>
						<IconButton
							className={styles.HistoryOrders__searchBarIcon}
							onClick={handleSearchClick}
						>
							<SearchIcon />
						</IconButton>
					</div>
					<div className={styles.scrollHoriztonal}>
						<div className={styles.HistoryOrders__orderHeader}>
							<div className={styles.justifyEndItem}>
								<h5>#ID</h5>
							</div>
							<div className={styles.justifyStartItem}>
								<h5>Date</h5>
							</div>
							<div>
								<h5>Name</h5>
							</div>
							<di>
								<h5>Item</h5>
							</di>
							<div className={styles.justifyEndItem}>
								<h5>Quantity</h5>
							</div>
							<div className={styles.justifyStartItem}>
								<h5>Total</h5>
							</div>
							<div className={`${styles.flex} ${styles.justifyStartItem}`}>
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
								<p style={{ textAlign: "center", margin: "0 auto" }}>
									{message}
								</p>
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
										<OrderHistoryTabComponent
											key={order.orderId}
											order={order}
										/>
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
			</div>
		</Layout>
	);
}

export default HistoryOrders;
