import { useRadioGroup } from "@mui/material";
import {
	collection,
	addDoc,
	setDoc,
	updateDoc,
	getDocs,
	getDoc,
	doc,
	query,
	orderBy,
	writeBatch,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	deleteField,
	FieldValue,
	limit,
	where,
} from "firebase/firestore";
import { db, increment, decrement } from "../../firebase/fireConfig";
import fetch from "isomorphic-fetch";

async function sendNotification(
	bizId,
	bizName,
	event,
	action,
	orderId,
	reasonsDeclineCancel,
	scheduleId,
	dayOfWeekIdx,
	recurring
	// isNotificationSent
) {
	// console.log("isNotificationSent", isNotificationSent);
	// * URL for sending notifications to heroku
	const baseUrl = "https://restoq.herokuapp.com/";
	const notificationEndPoint = "sendNotification";
	const notificationUrl = baseUrl + notificationEndPoint;

	// * Handle sending out notifications for flash schedule
	if (event === "flash" || event === "regular") {
		const customerFavesRef = collection(db, "biz", bizId, "customerFaves");
		const customerFavesSnap = await getDocs(customerFavesRef);
		let customerIdArr = [];
		let usersTokenArr = [];

		// * Loop through customerFaves collection to get array of customerId's who favorited
		customerFavesSnap.forEach((doc) => {
			const data = doc.data();
			const docId = doc.id;
			customerIdArr.push(docId);
		});

		// * Loop through customerIdArr to find userTokens of each customer.
		for (let i = 0; i < customerIdArr.length; i++) {
			const currId = customerIdArr[i];
			const userDocRef = doc(db, "userTokens", currId);
			const userSnap = await getDoc(userDocRef);
			const data = userSnap.data();
			const tokenArr = data.tokens;
			usersTokenArr = [...usersTokenArr, ...tokenArr];
		}

		if (usersTokenArr.length === 0) {
			return;
		}

		let data = {};

		// * Data for push notifications
		if (event === "flash") {
			data = {
				tokens: usersTokenArr,
				title: "NextPlate",
				msg: `⚡️ ${bizName} has a new flash sale. Get it before it's gone!`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		if (event === "regular") {
			console.log("hi");
			if (recurring) {
				data = {
					tokens: usersTokenArr,
					title: "NextPlate",
					msg: `${bizName} has a new weekly sale. Get it before it's gone!`,
					senderName: bizName,
					senderId: bizId,
					dataType: "flash",
				};
			} else {
				data = {
					tokens: usersTokenArr,
					title: "NextPlate",
					msg: `${bizName} has a new sale. Get it before it's gone!`,
					senderName: bizName,
					senderId: bizId,
					dataType: "flash",
				};
			}
		}

		// * Send push notifications
		return (
			fetch(notificationUrl, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})
				.then((data) => {
					const status = data.status;
					console.log("data", data);
					return { success: true };
				})
				// .then((status) => {
				// 	updateNotificationSent(bizId, scheduleId, dayOfWeekIdx);
				// })
				// .then((status) => {
				// 	return { success: true };
				// })
				.catch((error) => {
					console.log("notification", error);
					return { success: false, error };
				})
		);
	}

	// * Handle push notifications for incoming orders
	if (event === "response") {
		// * Go into orders collection of biz, and find customerId for the order
		const orderDocRef = doc(db, "biz", bizId, "orders", orderId);
		const orderSnap = await getDoc(orderDocRef);
		const orderData = orderSnap.data();
		const customerId = orderData.customerId;

		// * Use customerId to find customer's tokens array to send push notification
		const userDocRef = doc(db, "userTokens", customerId);
		const userSnap = await getDoc(userDocRef);
		const userData = userSnap.data();
		const userTokens = userData.tokens;
		let data = {};

		if (userTokens.length === 0) {
			return;
		}

		// * Push notification for confirming order
		if (action === "Confirmed") {
			data = {
				tokens: userTokens,
				title: "NextPlate",
				msg: `${bizName} has confirmed your order.`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		// * Push notification for declining order
		if (action === "Declined") {
			data = {
				tokens: userTokens,
				title: "NextPlate",
				msg: `${bizName} has declined your order. (${reasonsDeclineCancel})`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		// * Push notification for cancel order
		if (action === "Canceled") {
			data = {
				tokens: userTokens,
				title: "NextPlate",
				msg: `${bizName} has canceled your order. (${reasonsDeclineCancel})`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		return fetch(notificationUrl, {
			method: "POST",
			headers: {
				Accept: "application/josn",
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

async function updateNotificationSent(bizId, scheduleId, dayOfWeekIndex) {
	const bizDocRef = doc(db, "biz", bizId);
	const openHistoryDocRef = doc(db, "biz", bizId, "openHistory", scheduleId);

	const batch = writeBatch(db);

	batch.update(
		bizDocRef,
		{
			[`weeklySchedules.${dayOfWeekIndex}.${scheduleId}.notificationSent`]: true,
		},
		{ merge: true }
	);

	batch.update(openHistoryDocRef, { notificationSent: true }, { merge: true });

	try {
		await batch.commit();
	} catch (error) {
		console.log(error);
	}
}

export default sendNotification;
