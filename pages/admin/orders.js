import React, { useState, useEffect } from "react";
import Admin from "../../Components/Admin";
import Layout from "../../Components/Layout";
import styles from "../../styles/pages/admin/orders.module.css";
import {
	updateAdminAndBizPastOrders,
	getAdminOrdersPaginate,
	getTotalOrdersAdmin,
	getSearchOrderHistoryAdmin,
} from "../../actions/dashboard/ordersCrud";
import { CircularProgress } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { IconButton } from "@mui/material";
import {
	collection,
	query,
	where,
	onSnapshot,
	QuerySnapshot,
	orderBy,
	limit,
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import _ from "lodash";

const adminUid = "l8Nwe8miQOMhBsFfMGuJCwY0qLH3";

function Orders() {
	const [isSearchData, setIsSearchData] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusQuery, setStatusQuery] = useState([]);
	const [totalOrders, setTotalOrders] = useState({
		ordersLoading: false,
		ordersMessage: "",
		numOrders: 0,
	});
	const [adminOrdersValues, setAdminOrdersValues] = useState({
		loading: false,
		message: "",
		ordersArr: [],
		prevDoc: {},
		lastDoc: {},
		pageCount: 1,
		lastPage: false,
	});
	const [sort, setSort] = useState({
		date: "asc",
		orderId: "asc",
		custName: "asc",
		bizId: "asc",
		bizName: "asc",
		bizPhone: "asc",
		ownName: "asc",
		status: "asc",
		pickUp: "asc",
		itemName: "asc",
		quantity: "asc",
	});

	const { ordersLoading, ordersMessage, numOrders } = totalOrders;
	const { loading, message, ordersArr, prevDoc, lastDoc, pageCount, lastPage } =
		adminOrdersValues;
	const {
		date,
		orderId,
		custName,
		bizId,
		bizName,
		bizPhone,
		ownName,
		status,
		pickUp,
		itemName,
		quantity,
	} = sort;

	function statusStyle(status) {
		if (
			status === "Declined" ||
			status === "Cancelled" ||
			status === "No Show"
		) {
			return { color: "red" };
		} else if (status === "Reserved") {
			return { color: "orange" };
		} else if (status === "Confirmed") {
			return { color: "green" };
		} else if (status === "Completed") {
			return { color: "blue" };
		}
	}

	useEffect(() => {
		setAdminOrdersValues((prev) => ({
			...prev,
			loading: true,
			message: "",
		}));
		getTotalNumOrders(adminUid);
		updatePastOrders();
		const unsubscribe = loadAdminOrders(adminUid);

		return () => {
			unsubscribe();
		};
	}, []);

	// * UseEffect Actions --------------------------------------------------

	function loadAdminOrders(adminUid) {
		// * Get all orders, paginate by 15 / 20, sort by endTime
		const adminOrdersRef = collection(db, "admin", adminUid, "orders");
		const q = query(adminOrdersRef, orderBy("endTime", "desc"), limit(10));

		const unsubscribe = onSnapshot(
			q,
			(QuerySnapshot) => {
				const ordersArr = [];
				QuerySnapshot.forEach((doc) => {
					const data = doc.data();
					data.orderId = doc.id;
					ordersArr.push(data);
				});
				let lastDocument;
				if (ordersArr && ordersArr.length !== 0) {
					lastDocument = QuerySnapshot.docs[QuerySnapshot.docs.length - 1];
				}

				setAdminOrdersValues((prev) => ({
					...prev,
					loading: false,
					message: "",
					ordersArr,
					lastDoc: lastDocument,
					pageCount: 1,
				}));
			},
			(error) => {
				setAdminOrdersValues((prev) => ({
					...prev,
					loading: false,
					message: `Error fetching admin orders: ${error}`,
					pageCount: 1,
				}));
			}
		);

		return unsubscribe;
	}

	async function updatePastOrders() {
		const resAdminOrders = await updateAdminAndBizPastOrders();
		if (!resAdminOrders.success) {
			setAdminOrdersValues((prev) => ({
				...prev,
				loading: false,
				message: resAdminOrders.message,
			}));
		}
	}

	async function getTotalNumOrders(adminUid) {
		setTotalOrders((prev) => ({
			...prev,
			ordersLoading: true,
			ordersMessage: "",
		}));
		const resOrders = await getTotalOrdersAdmin(adminUid);
		if (resOrders.success) {
			const orders = resOrders.numOrders;
			setTotalOrders((prev) => ({
				...prev,
				ordersLoading: false,
				ordersMessage: "",
				numOrders: resOrders.numOrders,
			}));
		} else {
			setTotalOrders((prev) => ({
				...prev,
				ordersLoading: false,
				ordersMessage: resOrders.message,
			}));
		}
	}

	// * Actions ------------------------------------------------------

	async function handleSearchClick(e) {
		setAdminOrdersValues({ loading: true });

		const lowerCaseSearch = _.toLower(searchQuery);

		if (!searchQuery && statusQuery.length === 0) {
			loadAdminOrders(adminUid);
			setIsSearchData(false);
			return;
		} else {
			setIsSearchData(true);
		}

		// * Search order keywords only
		if (searchQuery && statusQuery.length === 0) {
			const resSearch = await getSearchOrderHistoryAdmin(
				adminUid,
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
					setAdminOrdersValues({
						loading: false,
						message: "No orders",
						pageCount: 1,
					});
				} else {
					const last = resSearch.lastDocu;

					setAdminOrdersValues({
						ordersArr: resSearch.sortedOrdersArr,
						loading: false,
						message: "",
						lastDoc: last,
						pageCount: 1,
					});
				}
			} else {
				setAdminOrdersValues({
					loading: false,
					message: resSearch.message,
					pageCount: 1,
				});
			}
		}

		// * Search order status only
		if (!searchQuery && statusQuery.length !== 0) {
			const resSearch = await getSearchOrderHistoryAdmin(
				adminUid,
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
					setAdminOrdersValues({
						loading: false,
						message: "No orders",
						pageCount: 1,
					});
				} else {
					const last = resSearch.lastDocu;

					setAdminOrdersValues({
						ordersArr: resSearch.sortedOrdersArr,
						loading: false,
						message: "",
						lastDoc: last,
						pageCount: 1,
					});
				}
			} else {
				setAdminOrdersValues({
					loading: false,
					message: resSearch.message,
					pageCount: 1,
				});
			}
		}

		// * Search order keywords & Status
		if (searchQuery && statusQuery.length !== 0) {
			const resSearch = await getSearchOrderHistoryAdmin(
				adminUid,
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
					setAdminOrdersValues({
						loading: false,
						message: "No orders",
						ordersArr: [],
						pageCount: 1,
					});
				} else {
					const last = resSearch.lastDocu;

					setAdminOrdersValues({
						ordersArr: resSearch.sortedOrdersArr,
						loading: false,
						message: "",
						lastDoc: last,
						pageCount: 1,
					});
				}
			} else {
				setAdminOrdersValues({
					loading: false,
					message: resSearch.message,
					pageCount: 1,
				});
			}
		}
	}

	function handleSort(name) {
		switch (name) {
			case "date":
				if (date === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => b.endTime - a.endTime),
						};
					});
					setSort((prev) => ({ ...prev, date: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => a.endTime - b.endTime),
						};
					});
					setSort((prev) => ({ ...prev, date: "asc" }));
				}
				break;
			case "orderId":
				if (orderId === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.orderId.toUpperCase();
								const idB = b.orderId.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, orderId: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.orderId.toUpperCase();
								const idB = b.orderId.toUpperCase();
								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, orderId: "asc" }));
				}
				break;
			case "custName":
				if (custName === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.customerName.toUpperCase();
								const idB = b.customerName.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, custName: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.customerName.toUpperCase();
								const idB = b.customerName.toUpperCase();
								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, custName: "asc" }));
				}
				break;
			case "bizId":
				if (bizId === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.bizId.toUpperCase();
								const idB = b.bizId.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, bizId: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.bizId.toUpperCase();
								const idB = b.bizId.toUpperCase();
								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, bizId: "asc" }));
				}
				break;
			case "bizName":
				if (bizName === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.bizName.toUpperCase();
								const idB = b.bizName.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, bizName: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.bizName.toUpperCase();
								const idB = b.bizName.toUpperCase();
								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, bizName: "asc" }));
				}
				break;
			case "bizPhone":
				if (bizPhone === "asc") {
					// TODO: No Phone
					// setAdminOrdersValues((prev) => {
					// 	return {
					// 		...prev,
					// 		ordersArr: ordersArr.sort((a, b) => b.endTime - a.endTime),
					// 	};
					// });
					setSort((prev) => ({ ...prev, bizPhone: "desc" }));
				} else {
					// TODO: No PHone
					// setAdminOrdersValues((prev) => {
					// 	return {
					// 		...prev,
					// 		ordersArr: ordersArr.sort((a, b) => a.endTime - b.endTime),
					// 	};
					// });
					setSort((prev) => ({ ...prev, bizPhone: "asc" }));
				}
				break;
			case "ownName":
				if (ownName === "asc") {
					// TODO: owner Name
					// setAdminOrdersValues((prev) => {
					// 	return {
					// 		...prev,
					// 		ordersArr: ordersArr.sort((a, b) => b.endTime - a.endTime),
					// 	};
					// });
					setSort((prev) => ({ ...prev, ownName: "desc" }));
				} else {
					// TODO: Owner Name
					// setAdminOrdersValues((prev) => {
					// 	return {
					// 		...prev,
					// 		ordersArr: ordersArr.sort((a, b) => a.endTime - b.endTime),
					// 	};
					// });
					setSort((prev) => ({ ...prev, ownName: "asc" }));
				}
				break;
			case "status":
				if (status === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.status.toUpperCase();
								const idB = b.status.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, status: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a.status.toUpperCase();
								const idB = b.status.toUpperCase();
								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB === idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, status: "asc" }));
				}
				break;
			case "pickUp":
				if (pickUp === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => b.endTime - a.endTime),
						};
					});
					setSort((prev) => ({ ...prev, pickUp: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => a.endTime - b.endTime),
						};
					});
					setSort((prev) => ({ ...prev, pickUp: "asc" }));
				}
				break;
			case "itemName":
				if (itemName === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idB = b[0].itemName.toUpperCase();
								const idA = a[0].itemName.toUpperCase();
								if (idA < idB) {
									return -1;
								}

								if (idA > idB) {
									return 1;
								}

								if (idB == idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, itemName: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								const idA = a[0].itemName.toUpperCase();

								const idB = b[0].itemName.toUpperCase();

								if (idA < idB) {
									return 1;
								}

								if (idA > idB) {
									return -1;
								}

								if (idB == idA) {
									return 0;
								}
							}),
						};
					});
					setSort((prev) => ({ ...prev, itemName: "asc" }));
				}
				break;
			case "quantity":
				if (quantity === "asc") {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort((a, b) => {
								b[0].quantity - a[0].quantity;
							}),
						};
					});
					setSort((prev) => ({ ...prev, quantity: "desc" }));
				} else {
					setAdminOrdersValues((prev) => {
						return {
							...prev,
							ordersArr: ordersArr.sort(
								(a, b) => a[0].quantity - b[0].quantity
							),
						};
					});
					setSort((prev) => ({ ...prev, quantity: "asc" }));
				}
				break;

			default:
				break;
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

	async function handlePageClick(e) {
		setAdminOrdersValues((prev) => ({ ...prev, loading: true }));
		const { name } = e.target;

		if (name === "prev") {
			if (isSearchData) {
				let resAdminOrders;
				if (lastPage) {
					resAdminOrders = await getSearchOrderHistoryAdmin(
						adminUid,
						searchQuery,
						statusQuery,
						"last",
						prevDoc
					);
				} else {
					resAdminOrders = await getSearchOrderHistoryAdmin(
						adminUid,
						searchQuery,
						statusQuery,
						name,
						prevDoc
					);
				}

				if (resAdminOrders.success) {
					const ordersDataArr = resAdminOrders.sortedOrdersArr;

					const lastDocu = resAdminOrders.lastDocu;
					const prevDocu = resAdminOrders.prevDocu;

					setAdminOrdersValues((prev) => ({
						...prev,
						loading: false,
						prevDoc: prevDocu,
						ordersArr: ordersDataArr,
						lastDoc: lastDocu,
						lastPage: false,
						message: "",
						pageCount: prev.pageCount - 1,
					}));
				} else {
					setAdminOrdersValues((prev) => ({
						...prev,
						loading: false,
						message: resAdminOrders.message,
					}));
				}
			} else {
				let resAdminOrders;
				if (lastPage) {
					resAdminOrders = await getAdminOrdersPaginate(
						"last",
						prevDoc,
						adminUid
					);
				} else {
					resAdminOrders = await getAdminOrdersPaginate(
						name,
						prevDoc,
						adminUid
					);
				}

				if (resAdminOrders.success) {
					const ordersDataArr = resAdminOrders.adminOrdersArr;

					const prevDocu = resAdminOrders.prevDocu;
					const lastDocu = resAdminOrders.lastDocu;

					setAdminOrdersValues((prev) => ({
						...prev,
						loading: false,
						prevDoc: prevDocu,
						ordersArr: ordersDataArr,
						lastDoc: lastDocu,
						lastPage: false,
						message: "",
						pageCount: prev.pageCount - 1,
					}));
				} else {
					setAdminOrdersValues((prev) => ({
						...prev,
						loading: false,
						message: resAdminOrders.message,
					}));
				}
			}
		}

		if (name === "next") {
			if (isSearchData) {
				const resAdminOrders = await getSearchOrderHistoryAdmin(
					adminUid,
					searchQuery,
					statusQuery,
					name,
					lastDoc
				);

				if (resAdminOrders.success) {
					const ordersDataArr = resAdminOrders.sortedOrdersArr;

					const lastDocu = resAdminOrders.lastDocu;
					const prevDocu = resAdminOrders.prevDocu;

					if (ordersDataArr.length === 0) {
						setAdminOrdersValues((prev) => ({
							...prev,
							loading: false,
							prevDoc: lastDocu,
							lastPage: true,
							message: "No more orders.",
							pageCount: prev.pageCount + 1,
						}));
					} else {
						setAdminOrdersValues((prev) => ({
							...prev,
							loading: false,
							ordersArr: ordersDataArr,
							lastDoc: lastDocu,
							prevDoc: prevDocu,
							pageCount: prev.pageCount + 1,
						}));
					}
				}
			} else {
				const resAdminOrders = await getAdminOrdersPaginate(
					name,
					lastDoc,
					adminUid
				);

				if (resAdminOrders.success) {
					const ordersDataArr = resAdminOrders.adminOrdersArr;

					const prevDocu = resAdminOrders.prevDocu;
					const lastDocu = resAdminOrders.lastDocu;

					if (ordersDataArr.length === 0) {
						setAdminOrdersValues((prev) => ({
							...prev,
							loading: false,
							prevDoc: lastDoc,
							lastPage: true,
							message: "No more orders.",
							pageCount: prev.pageCount + 1,
						}));
					} else {
						setAdminOrdersValues((prev) => ({
							...prev,
							loading: false,
							ordersArr: ordersDataArr,
							lastDoc: lastDocu,
							prevDoc: prevDocu,
							pageCount: prev.pageCount + 1,
						}));
					}
				}
			}
		}
	}

	return (
		<Layout currentPage="admin">
			<Admin>
				<div className={styles.Orders}>
					<div className={styles.Orders__filters}>
						<h2>Filters</h2>
						<div className={styles.Orders__filtersItemContainer}>
							<h3>Status:</h3>
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
					<div className={styles.Orders__main}>
						<div className={styles.Orders_searchBar}>
							<input
								type="text"
								placeholder="Search orders..."
								onChange={handleChange}
								name="search"
								value={searchQuery}
							/>
							<button name="search" onClick={handleSearchClick}>
								Search
							</button>
							<div>
								<h3>Total Orders:</h3>
								<p>{numOrders ? numOrders : "0"}</p>
							</div>
						</div>

						<div className={styles.Orders__listContainer}>
							<div className={styles.Orders__listHeader}>
								<div>
									<h5>Date</h5>
									<IconButton onClick={() => handleSort("date")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>#Order Id</h5>
									<IconButton onClick={() => handleSort("orderId")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Cust. Name</h5>
									<IconButton onClick={() => handleSort("custName")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>#Biz Id</h5>
									<IconButton onClick={() => handleSort("bizId")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Biz Name</h5>
									<IconButton onClick={() => handleSort("bizName")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Biz Phone</h5>
									<IconButton onClick={() => handleSort("bizPhone")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Own. Name</h5>
									<IconButton onClick={() => handleSort("ownName")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Status</h5>
									<IconButton onClick={() => handleSort("status")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Pick Up</h5>
									<IconButton onClick={() => handleSort("pickUp")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Item Name</h5>
									<IconButton onClick={() => handleSort("itemName")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
								<div>
									<h5>Quantity</h5>
									<IconButton onClick={() => handleSort("quantity")}>
										<ArrowDropDownIcon />
									</IconButton>
								</div>
							</div>
							{loading ? (
								<p className={styles.Orders__error}> {<CircularProgress />} </p>
							) : message ? (
								<p className={styles.Orders__error}>{message}</p>
							) : (
								<div className={styles.Order__listBody}>
									{ordersArr.map((order, i) => {
										return (
											<div key={order.orderId} className={styles.Orders__list}>
												<p>{order.pickupDate}</p>
												<p>{order.orderId}</p>
												<p>{order.customerName}</p>
												<p>{order.bizId}</p>
												<p>{order.bizName}</p>
												<p>123 123-1234</p>
												<p>Garwing Lai</p>
												<p style={statusStyle(order.status)}>{order.status}</p>
												<p>{order.pickupWindow}</p>
												{/* //TODO: remove order.items */}
												<p>{order.items && order.items[0].itemName}</p>
												<p>{order.items && order.items[0].quantity}</p>
											</div>
										);
									})}
								</div>
							)}
							<div className={styles.Orders__nextPrev}>
								<button
									name="prev"
									onClick={handlePageClick}
									disabled={pageCount == 1}
								>
									prev
								</button>
								<button
									name="next"
									onClick={handlePageClick}
									disabled={
										lastPage
											? true
											: !ordersArr
											? true
											: ordersArr.length === 10
											? false
											: true
									}
								>
									next
								</button>
							</div>
						</div>
					</div>
				</div>
			</Admin>
		</Layout>
	);
}

export default Orders;
