import {
	collection,
	addDoc,
	getDocs,
	updateDoc,
	arrayUnion,
	getDoc,
	doc,
	query,
	orderBy,
	limit,
	startAfter,
	endBefore,
	endAt,
	startAt,
	writeBatch,
	serverTimestamp,
	deleteDoc,
	where,
	limitToLast,
} from "firebase/firestore";
import {
	db,
	increment,
	decrement,
	incrementArgs,
	decrementArgs,
} from "../../firebase/fireConfig";
import _ from "lodash";
import fetch from "isomorphic-fetch";

// * Admin & Biz orders page will update
async function updatePastOrders(bizId) {
	if (!bizId) {
		return;
	}

	const adminUid = "l8Nwe8miQOMhBsFfMGuJCwY0qLH3";

	// * Orders collection ref -----------------------------------
	const ordersCollectionRef = collection(db, "biz", bizId, "orders");
	const adminOrders = collection(db, "admin", adminUid, "orders");

	// * Update previous dates to completed ------------------------
	const date = new Date();
	const actualDate = date.toDateString();
	const todayStartTime = "00:00";
	const dateStartEpocMS = Date.parse(actualDate + " " + todayStartTime);

	const batch = writeBatch(db);

	// * Specific Biz's order queries -------------------------------
	const queryConfirmedPast = query(
		ordersCollectionRef,
		where("endTime", "<", dateStartEpocMS),
		where("status", "==", "Confirmed")
	);

	const queryReservedPast = query(
		ordersCollectionRef,
		where("endTime", "<", dateStartEpocMS),
		where("status", "==", "Reserved")
	);

	// * Admin queries ----------------------------------------------
	const queryConfirmedPastAdmin = query(
		adminOrders,
		where("endTime", "<", dateStartEpocMS),
		where("status", "==", "Confirmed")
	);

	const queryReservedPastAdmin = query(
		adminOrders,
		where("endTime", "<", dateStartEpocMS),
		where("status", "==", "Reserved")
	);

	try {
		// * Admin getDocs
		const pastAdminConfirmedOrdersSnapShot = await getDocs(
			queryConfirmedPastAdmin
		);
		const pastAdminReservedOrdersSnapShot = await getDocs(
			queryReservedPastAdmin
		);

		const pastAdminConfirmedUidArr = [];
		const pastAdminReservedUidArr = [];

		pastAdminConfirmedOrdersSnapShot.forEach((doc) => {
			const id = doc.id;
			pastAdminConfirmedUidArr.push(id);
		});

		pastAdminReservedOrdersSnapShot.forEach((doc) => {
			const id = doc.id;
			pastAdminReservedUidArr.push(id);
		});

		// * Admin looping UID to update
		for (let i = 0; i < pastAdminConfirmedUidArr.length; i++) {
			const currorderId = pastAdminConfirmedUidArr[i];
			const orderRef = doc(db, "admin", adminUid, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Completed",
					statusIndex: 3,
					statusArr: arrayUnion("Completed"),
				},
				{ merge: true }
			);
		}

		for (let j = 0; j < pastAdminReservedUidArr.length; j++) {
			const currorderId = pastAdminReservedUidArr[j];
			const orderRef = doc(db, "admin", adminUid, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Declined",
					statusIndex: 2,
					statusArr: arrayUnion("Declined"),
					reasonDeclineOrCancel: "Business did not accept in time",
				},
				{ merge: true }
			);
		}

		// * Biz orders getDocs
		const pastConfirmedOrdersSnapShot = await getDocs(queryConfirmedPast);
		const pastReservedOrdersSnapShot = await getDocs(queryReservedPast);

		const pastConfirmedUidArr = [];
		const pastReservedUidArr = [];

		pastConfirmedOrdersSnapShot.forEach((doc) => {
			const id = doc.id;
			pastConfirmedUidArr.push(id);
		});

		pastReservedOrdersSnapShot.forEach((doc) => {
			const id = doc.id;
			pastReservedUidArr.push(id);
		});

		// * Biz Orders, looping UID to update
		for (let i = 0; i < pastConfirmedUidArr.length; i++) {
			const currorderId = pastConfirmedUidArr[i];
			const orderRef = doc(db, "biz", bizId, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Completed",
					statusIndex: 3,
					statusArr: arrayUnion("Completed"),
				},
				{ merge: true }
			);
		}

		for (let j = 0; j < pastReservedUidArr.length; j++) {
			const currorderId = pastReservedUidArr[j];
			const orderRef = doc(db, "biz", bizId, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Declined",
					statusIndex: 2,
					statusArr: arrayUnion("Declined"),
					reasonDeclineOrCancel: "Business did not accept in time",
				},
				{ merge: true }
			);
		}
		await batch.commit();
		return { success: true };
	} catch (error) {
		return { success: false, message: `Error updating past orders: ${error}` };
	}
}

async function getOrderHistory(bizId, round, prevEndTime) {
	if (!bizId) {
		return;
	}
	console.log(bizId, round);
	const date = new Date();
	// const actualDate = date.toDateString();
	// const todayStartTime = "00:00";
	const todayStartEpoch = Date.parse(date);

	const orderCollectionRef = collection(db, "biz", bizId, "orders");
	let queryRound;

	if (round === "first") {
		queryRound = query(
			orderCollectionRef,
			where("endTime", "<", todayStartEpoch),
			orderBy("endTime", "desc"),
			// orderBy("endTime"),
			limit(10)
		);
	} else if (round === "prev") {
		queryRound = query(
			orderCollectionRef,
			where("endTime", "<", todayStartEpoch),
			orderBy("endTime", "desc"),
			endBefore(prevEndTime),
			limitToLast(10)
		);
	} else if (round === "next") {
		queryRound = query(
			orderCollectionRef,
			where("endTime", "<", todayStartEpoch),
			orderBy("endTime", "desc"),
			startAfter(prevEndTime),
			limit(10)
		);
	} else if (round === "last") {
		queryRound = query(
			orderCollectionRef,
			where("endTime", "<", todayStartEpoch),
			orderBy("endTime", "desc"),
			endAt(prevEndTime),
			limitToLast(10)
		);
	}

	try {
		const ordersArr = [];
		const docSnap = await getDocs(queryRound);

		const lastDocu = docSnap.docs[docSnap.docs.length - 1];
		const prevDocu = docSnap.docs[0];

		docSnap.forEach((doc) => {
			const data = doc.data();
			data.orderId = doc.id;
			ordersArr.push(data);
		});
		console.log(ordersArr);

		return { success: true, ordersArr, lastDocu, prevDocu };
	} catch (error) {
		return { success: false, message: `Error retrieving data. ${error}` };
	}
}

async function getSearchOrderHistory(
	bizId,
	searchQuery,
	statusQuery,
	round,
	prevDoc
) {
	let firstQuery;
	let searchArr;

	const bizOrdersDocRef = collection(db, "biz", bizId, "orders");

	// * Search order keywords only
	if (searchQuery && !statusQuery) {
		searchArr = searchQuery.split(" ");
		if (round === "first") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	// * Search order status only
	if (!searchQuery && statusQuery) {
		if (round === "first") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	// * Search order keywords & Status
	if (searchQuery && statusQuery) {
		searchArr = searchQuery.split(" ");
		if (round === "first") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				bizOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	try {
		const ordersSearchDocSnap = await getDocs(firstQuery);

		const lastDocu =
			ordersSearchDocSnap.docs[ordersSearchDocSnap.docs.length - 1];
		const prevDocu = ordersSearchDocSnap.docs[0];

		let ordersArr = [];

		ordersSearchDocSnap.forEach((doc) => {
			const data = doc.data();

			data.orderId = doc.id;
			ordersArr.push(data);
		});

		if (statusQuery && searchQuery) {
			if (statusQuery.length !== 0 && searchArr.length !== 0) {
				ordersArr = ordersArr.filter((item) =>
					statusQuery.includes(item.status)
				);
			}
		}

		const sortedOrdersArr = ordersArr.sort((a, b) => (a.endTime = b.endTime));

		return { success: true, sortedOrdersArr, lastDocu, prevDocu };
	} catch (error) {
		console.log(error);
		return { success: false, message: "Error fetching search results." };
	}
}

async function getSearchOrderHistoryAdmin(
	adminUid,
	searchQuery,
	statusQuery,
	round,
	prevDoc
) {
	let firstQuery;
	let searchArr;

	const adminOrdersDocRef = collection(db, "admin", adminUid, "orders");

	// * Search order keywords only
	if (searchQuery && !statusQuery) {
		searchArr = searchQuery.split(" ");
		if (round === "first") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	// * Search order status only
	if (!searchQuery && statusQuery) {
		if (round === "first") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("status", "in", statusQuery),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	// * Search order keywords & Status
	if (searchQuery && statusQuery) {
		searchArr = searchQuery.split(" ");
		if (round === "first") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				limit(10)
			);
		} else if (round === "prev") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endBefore(prevDoc),
				limitToLast(10)
			);
		} else if (round === "next") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				startAfter(prevDoc),
				limit(10)
			);
		} else if (round === "last") {
			firstQuery = query(
				adminOrdersDocRef,
				orderBy("endTime", "desc"),
				where("keywords", "array-contains-any", searchArr),
				endAt(prevDoc),
				limitToLast(10)
			);
		}
	}

	try {
		const ordersSearchDocSnap = await getDocs(firstQuery);

		const lastDocu =
			ordersSearchDocSnap.docs[ordersSearchDocSnap.docs.length - 1];
		const prevDocu = ordersSearchDocSnap.docs[0];

		let ordersArr = [];
		ordersSearchDocSnap.forEach((doc) => {
			const data = doc.data();

			data.orderId = doc.id;
			ordersArr.push(data);
		});

		console.log(ordersArr);

		if (statusQuery && searchQuery) {
			if (statusQuery.length !== 0 && searchArr.length !== 0) {
				ordersArr = ordersArr.filter((item) =>
					statusQuery.includes(item.status)
				);
			}
		}

		const sortedOrdersArr = ordersArr.sort((a, b) => (a.endTime = b.endTime));

		return { success: true, sortedOrdersArr, lastDocu, prevDocu };
	} catch (error) {
		console.log(error);
		return { success: false, message: "Error fetching search results." };
	}
}

async function updateOrder(
	customerId,
	orderId,
	bizId,
	getStatus,
	getStatusIndex,
	reason,
	dayIndex,
	pickupWindowId,
	subtotalAmt,
	taxAmt,
	chargeId
) {
	const adminUid = "l8Nwe8miQOMhBsFfMGuJCwY0qLH3";
	const stringPrice = subtotalAmt + taxAmt;
	const totalPrice = +stringPrice.toFixed(2);

	// * Order doc ref
	const bizOrderDocRef = doc(db, "biz", bizId, "orders", orderId);
	// * Order doc ref Admin
	const orderDocRefAdmin = doc(db, "admin", adminUid, "orders", orderId);
	// * Admin orderCount doc ref
	const docRefAdminOrderCount = doc(db, "admin", adminUid);
	// * Customer Order Ref
	const customerOrderDocRef = doc(
		db,
		"users",
		customerId,
		"purchases",
		orderId
	);
	// * Biz doc ref
	const bizDocRef = doc(db, "biz", bizId);

	const batch = writeBatch(db);
	let paymentMessage;

	if (getStatus === "Confirmed") {
		const resPaymentCharge = await chargePayment(getStatus, chargeId);
		console.log(resPaymentCharge);
		if (!resPaymentCharge.success) {
			if (resPaymentCharge.status) {
				return {
					success: false,
					message: `Could not charge payment. Status${resPaymentCharge.status}`,
				};
			} else {
				return {
					success: false,
					message: `Error with accepting payment: ${resPaymentCharge.error}`,
				};
			}
		} else {
			paymentMessage = "Successfully charged customer.";
		}

		// * Update Admin Order
		batch.update(orderDocRefAdmin, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		// * Update Biz Order ref
		batch.update(bizOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		// * Update Customer Order
		batch.update(customerOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		try {
			await batch.commit();
			return { success: true, paymentMessage };
		} catch (error) {
			return {
				success: false,
				message: `Error updating order. The order was still accepted and the customer was charged. ${error}`,
			};
		}
	}

	// * If declined, add reason update status and numAvail decrease
	if (getStatus === "Declined") {
		// * Update Admin Order
		batch.set(
			orderDocRefAdmin,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(orderDocRefAdmin, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		// * Update Biz Order
		batch.set(
			bizOrderDocRef,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(bizOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		// * Update Customer Order
		batch.set(
			customerOrderDocRef,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(customerOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
			isNoticed: true,
		});

		try {
			await batch.commit();
			return { success: true, message: "Successfully declined" };
		} catch (error) {
			return {
				success: false,
				message: `Could not decline/cancel.`,
			};
		}
	}

	// * If cancelled, add reason update status
	if (getStatus === "Cancelled") {
		const resPaymentCharge = await chargePayment(getStatus, chargeId);
		if (!resPaymentCharge.success) {
			if (resPaymentCharge.status) {
				return {
					success: false,
					message: `Could not refund payment. Status${resPaymentCharge.status}`,
				};
			} else {
				return {
					success: false,
					message: `Error with refunding payment: ${resPaymentCharge.error}`,
				};
			}
		} else {
			paymentMessage =
				"Successfully refunded customer. The credit card fee will be charged to you on your next payout.";
		}

		// * Update Admin Order
		batch.set(
			orderDocRefAdmin,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(orderDocRefAdmin, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update Biz Order
		batch.set(
			bizOrderDocRef,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(bizOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update Customer Order
		batch.set(
			customerOrderDocRef,
			{ reasonDeclineOrCancel: reason },
			{ merge: true }
		);
		batch.update(customerOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		try {
			await batch.commit();
			return { success: true, paymentMessage };
		} catch (error) {
			return {
				success: false,
				message: `Error cancelling. The payment was still refunded to the customer. The business will accrue the credit card fees. Error: ${error}`,
			};
		}
	}

	// * Update increment numOrders
	if (getStatus === "Completed") {
		// * Increment Orders Biz Doc
		batch.update(bizDocRef, { numOrders: increment });

		// * Increment ordreCount in AdminUid
		batch.update(docRefAdminOrderCount, { numOrders: increment });

		// * Update Admin Order
		batch.update(orderDocRefAdmin, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update Biz Order
		batch.update(bizOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update total Revenue in biz Doc
		batch.update(bizDocRef, {
			totalRevenue: incrementArgs(totalPrice),
		});

		// * Update Customer Order
		batch.update(customerOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		try {
			await batch.commit();
			return { success: true, message: "Order marked as Completed." };
		} catch (error) {
			return {
				success: false,
				message: `Error updating order. ${error}`,
			};
		}
	}

	if (getStatus === "No Show") {
		// * Increment Orders Biz
		batch.update(bizDocRef, { numOrders: increment });

		// * Increment ordreCount in AdminUid
		batch.update(docRefAdminOrderCount, { numOrders: increment });

		// * Update Admin Order
		batch.update(orderDocRefAdmin, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update Biz Order
		batch.update(bizOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		// * Update total Revenue in biz Doc
		batch.update(bizDocRef, {
			totalRevenue: incrementArgs(totalPrice),
		});

		// * Update Customer Order
		batch.update(customerOrderDocRef, {
			status: getStatus,
			statusIndex: getStatusIndex,
			statusArr: arrayUnion(getStatus),
		});

		try {
			await batch.commit();
			return { success: true, message: "Order marked as No Show." };
		} catch (error) {
			return {
				success: false,
				message: `Error updating order. ${error}`,
			};
		}
	}
}

async function chargePayment(getStatus, chargeId) {
	console.log(getStatus, chargeId);
	let baseUrl = "https://restoq.herokuapp.com/";
	const capturePaymentVisa = "capturePaymentNP";
	const refundPayment = "refundNP";

	// * Free orders
	if (chargeId === "noId") {
		return { success: true };
	}

	// * Charge Stripe
	if (getStatus === "Confirmed") {
		baseUrl = baseUrl.concat(capturePaymentVisa);
		const data = { chargeId };

		return fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		})
			.then((data) => {
				const status = data.status;

				if (status === 200) {
					return { success: true, status };
				} else {
					return { success: false, status };
				}
			})
			.catch((error) => {
				return { success: false, error };
			});
	}

	// * Refund Stripe
	if (getStatus === "Cancelled") {
		baseUrl = baseUrl.concat(refundPayment);
		const data = { chargeId };

		return fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		})
			.then((data) => {
				const status = data.status;

				if (status === 200) {
					return { success: true, status };
				} else {
					return { success: false, status };
				}
			})
			.catch((error) => {
				return { success: false, error };
			});
	}
}

async function updateOrderIsNoticed(bizId, orderId) {
	const orderRef = doc(db, "biz", bizId, "orders", orderId);

	try {
		await updateDoc(orderRef, { isNoticed: true });
		return { success: true };
	} catch (error) {
		return { success: false, message: `Error updating notification: ${error}` };
	}
}

async function updateAdminAndBizPastOrders() {
	// * Update past biz orders
	// * Get collection of all biz and push each UID to bizIdArr
	const bizIdArr = [];
	const bizesRef = collection(db, "biz");

	try {
		const bizesSnapShot = await getDocs(bizesRef);
		bizesSnapShot.forEach((doc) => {
			const bizId = doc.id;
			bizIdArr.push(bizId);
		});
	} catch (error) {
		return { success: false, message: `Error getting biz uid: ${error}` };
	}

	// * With bizIdArr, loop through uid, query each business before today
	// * Find past confirmed and reserved to update
	const date = new Date();
	const actualDate = date.toDateString();
	const todayStartTime = "00:00";
	const dateStartEpocMS = Date.parse(actualDate + " " + todayStartTime);

	const batch = writeBatch(db);

	for (let i = 0; i < bizIdArr.length; i++) {
		// * Get All orders collection from each biz with confirmed and reserved queries
		const currbizId = bizIdArr[i];
		const bizOrdersRef = collection(db, "biz", currbizId, "orders");

		const queryConfirmedPast = query(
			bizOrdersRef,
			where("endTime", "<", dateStartEpocMS),
			where("status", "==", "Confirmed")
		);

		const queryReservedPast = query(
			bizOrdersRef,
			where("endTime", "<", dateStartEpocMS),
			where("status", "==", "Reserved")
		);

		// * Get all orders with correct query,
		// * Push UID of each found order,
		// * Loop through uids and udpate
		const pastConfirmedUidArr = [];
		const pastReservedUidArr = [];

		try {
			const pastConfirmedOrdersSnapShot = await getDocs(queryConfirmedPast);
			const pastReservedOrdersSnapShot = await getDocs(queryReservedPast);

			pastConfirmedOrdersSnapShot.forEach((doc) => {
				const id = doc.id;
				pastConfirmedUidArr.push(id);
			});

			pastReservedOrdersSnapShot.forEach((doc) => {
				const id = doc.id;
				pastReservedUidArr.push(id);
			});
		} catch (error) {
			return { success: false, message: `Error updating past docs: ${error}` };
		}

		// * Loops through uid arrays to batch update
		for (let i = 0; i < pastConfirmedUidArr.length; i++) {
			const currorderId = pastConfirmedUidArr[i];
			const orderRef = doc(db, "biz", currbizId, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Completed",
					statusIndex: 3,
					statusArr: arrayUnion("Completed"),
				},
				{ merge: true }
			);
		}

		for (let j = 0; j < pastReservedUidArr.length; j++) {
			const currorderId = pastReservedUidArr[j];
			const orderRef = doc(db, "biz", currbizId, "orders", currorderId);
			batch.update(
				orderRef,
				{
					status: "Declined",
					statusIndex: 2,
					statusArr: arrayUnion("Declined"),
					reasonDeclineOrCancel: "Business did not accept in time",
				},
				{ merge: true }
			);
		}
	}

	// * Batch commit all udpates
	try {
		await batch.commit();
		return { success: true };
	} catch (error) {
		return { success: false, message: `Error commiting to batch: ${error}` };
	}
}

async function getAdminOrdersPaginate(round, lastDoc, adminUid) {
	const adminOrdersRef = collection(db, "admin", adminUid, "orders");
	let queryRound;

	if (round === "prev") {
		queryRound = query(
			adminOrdersRef,
			orderBy("endTime", "desc"),
			endBefore(lastDoc),
			limitToLast(10)
		);
	} else if (round === "next") {
		queryRound = query(
			adminOrdersRef,
			orderBy("endTime", "desc"),
			startAfter(lastDoc),
			limit(10)
		);
	} else if (round === "last") {
		queryRound = query(
			adminOrdersRef,
			orderBy("endTime", "desc"),
			endAt(lastDoc),
			limitToLast(10)
		);
	}

	try {
		const adminOrdersSnap = await getDocs(queryRound);

		const lastDocu = adminOrdersSnap.docs[adminOrdersSnap.docs.length - 1];
		const prevDocu = adminOrdersSnap.docs[0];

		let adminOrdersArr = [];
		adminOrdersSnap.forEach((doc) => {
			const data = doc.data();
			data.orderId = doc.id;
			adminOrdersArr.push(data);
		});
		return { success: true, adminOrdersArr, lastDocu, prevDocu };
	} catch (error) {
		return { success: false, message: `Error getting admin orders: ${error}` };
	}
}

async function getTotalOrdersAdmin(adminUid) {
	const adminOrdersDocRef = doc(db, "admin", adminUid);

	const adminOrderDocSnap = await getDoc(adminOrdersDocRef);
	if (adminOrderDocSnap.exists()) {
		const data = adminOrderDocSnap.data();
		const numOrders = data.numOrders;
		return { success: true, numOrders };
	} else {
		return { success: false, message: "Could not retrive number of orders." };
	}
}

export {
	updatePastOrders,
	updateOrder,
	updateOrderIsNoticed,
	getOrderHistory,
	updateAdminAndBizPastOrders,
	getAdminOrdersPaginate,
	getTotalOrdersAdmin,
	getSearchOrderHistory,
	getSearchOrderHistoryAdmin,
};

// * Specific Biz's order queries -------------------------------
