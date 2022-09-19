import { useRadioGroup } from "@mui/material";
import {
	collection,
	getDocs,
	getDoc,
	doc,
	writeBatch,
	updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import fetch from "isomorphic-fetch";
import getNearbyUserId from "../../helper/GeoHash";
import { getCustomerPhone } from "../crud/user";
import { getBizCollection } from "../crud/bizUser";

const sendNotifAutomated = async () => {
	const bizArr = await getBizCollection();
	const bizHasRegArr = getBizWithRecur(bizArr);
	const adminId = "6IUWvD23ayVkRlxaO2wtSM2faNB3";

	sendOneNotif(adminId, bizHasRegArr);

	// * Enable code to send every fifteen Min for each biz.
	// for (let i = 0; i < bizHasRegArr.length; i++) {
	// 	const currBiz = bizHasRegArr[i];
	// 	const { id: bizId, name: bizName, emoji } = currBiz;
	// 	const event = "regular";

	// 	const fifteenMili = 15 * 60 * 1000;

	// 	setTimeout(() => {
	// 		sendNotifRecur(bizId, event, bizName, emoji);
	// 	}, fifteenMili * i);
	// }
};

const sendOneNotif = async (adminId, bizHasRegArr) => {
	const baseUrl = "https://restoq.herokuapp.com/";
	const notificationEndPoint = "sendNotification";
	const notificationUrl = baseUrl + notificationEndPoint;
	const sender = "NextPlate";
	const event = "regular";

	let customerIdArr = [];
	let usersTokenArr = [];

	for (let j = 0; j < bizHasRegArr.length; j++) {
		const currBiz = bizHasRegArr[j];
		const { id: bizId } = currBiz;

		const customerFavesRef = collection(db, "biz", bizId, "customerFaves");
		const customerFavesSnap = await getDocs(customerFavesRef);
		console.log("in function send notif");

		customerFavesSnap.forEach((doc) => {
			const data = doc.data();
			const docId = doc.id;

			customerIdArr.push(docId);
		});
	}

	// * Loop through customerIdArr to find userTokens of each customer.
	for (let i = 0; i < customerIdArr.length; i++) {
		const currId = customerIdArr[i];
		// console.log(currId);
		const userDocRef = doc(db, "userTokens", currId);
		const userSnap = await getDoc(userDocRef);
		const data = userSnap.data();
		const tokenArr = data.tokens;
		usersTokenArr = [...usersTokenArr, ...tokenArr];
	}

	console.log(usersTokenArr, customerIdArr);

	if (usersTokenArr.length === 0) {
		console.log("here");
		return;
	}

	let shortenedUserTokens = [];

	if (usersTokenArr.length >= 1000) {
		shortenedUserTokens = usersTokenArr.slice(0, 999);
	}

	console.log(shortenedUserTokens);

	let data = {
		tokens: shortenedUserTokens,
		title: "🍽 NextPlate",
		msg: `⚡️ Thanks for being a hero. Don't miss a chance to rescue a delicious 🍔 today!`,
		senderName: sender,
		senderId: adminId,
		dataType: event,
	};

	console.log("data", data);

	// * Send push notifications
	// return fetch(notificationUrl, {
	// 	method: "POST",
	// 	headers: {
	// 		Accept: "application/json",
	// 		"Content-Type": "application/json",
	// 	},
	// 	body: JSON.stringify(data),
	// })
	// 	.then((data) => {
	// 		const status = data.status;
	// 		console.log("notif sent", status);
	// 	})
	// 	.catch((error) => {
	// 		console.log("notification", error);
	// 	});
};

// * Send notif by each biz
const sendNotifRecur = async (bizId, event, bizName, emoji) => {
	const baseUrl = "https://restoq.herokuapp.com/";
	const notificationEndPoint = "sendNotification";
	const notificationUrl = baseUrl + notificationEndPoint;

	const lastNotifSent = await getRecentNotif(bizId);

	if (lastNotifSent) {
		const date = new Date();
		const epochTime = Date.parse(date);
		const twentyMinInMili = 20 * 60 * 1000;
		const bufferNotifTime = lastNotifSent + twentyMinInMili;

		if (epochTime <= bufferNotifTime) {
			console.log("epoch", epochTime);
			console.log("bufferNotifTime", bufferNotifTime);
			return;
		}
	}

	const customerFavesRef = collection(db, "biz", bizId, "customerFaves");
	const customerFavesSnap = await getDocs(customerFavesRef);
	let customerIdArr = [];
	let usersTokenArr = [];

	customerFavesSnap.forEach((doc) => {
		const data = doc.data();
		const docId = doc.id;

		customerIdArr.push(docId);
	});

	// * If favorited customers is less than 50, send to nearby 50.
	const numOfCustomers = customerIdArr.length;

	if (numOfCustomers < 51) {
		const nearbyUserIdArr = await getNearbyUserId(bizId, customerIdArr);

		customerIdArr = [...customerIdArr, ...nearbyUserIdArr];
	}

	// * Loop through customerIdArr to find userTokens of each customer.
	for (let i = 0; i < customerIdArr.length; i++) {
		const currId = customerIdArr[i];
		// console.log(currId);
		const userDocRef = doc(db, "userTokens", currId);
		const userSnap = await getDoc(userDocRef);
		const data = userSnap.data();
		const tokenArr = data.tokens;
		usersTokenArr = [...usersTokenArr, ...tokenArr];
	}

	if (usersTokenArr.length === 0) {
		return;
	}

	let data = {
		tokens: usersTokenArr,
		title: "🍽 NextPlate",
		msg: `Craving ${emoji}? ${bizName} has some sweet deals! Be a hero and rescue a meal.`,
		senderName: bizName,
		senderId: bizId,
		dataType: event,
	};

	await updateLastNotifSent(bizId);

	// * Send push notifications
	return fetch(notificationUrl, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	})
		.then((data) => {
			const status = data.status;
			console.log("notif sent");

			return { success: true };
		})
		.catch((error) => {
			console.log("notification", error);
			return { success: false, error };
		});
};

const getBizWithRecur = (bizArr) => {
	const bizHasRegSched = [];

	for (let i = 0; i < bizArr.length; i++) {
		const currBiz = bizArr[i];
		const weeklySched = currBiz.weeklySchedules;

		if (weeklySched || Object.keys(weeklySched).length !== 0) {
			const dayIdxArr = Object.keys(weeklySched);
			const todayDayIdx = getTodayDayIdx();

			if (dayIdxArr.includes(todayDayIdx)) {
				const schedsInDay = weeklySched[todayDayIdx];

				if (schedsInDay || Object.keys(schedsInDay).length !== 0) {
					const schedIdsArr = Object.keys(schedsInDay);

					for (let k = 0; k < schedIdsArr.length; k++) {
						const currId = schedIdsArr[k];
						const schedule = schedsInDay[currId];
						const statusIndex = schedule.statusIndex;

						if (statusIndex === 0) {
							bizHasRegSched.push(currBiz);
							break;
						}
					}
				}
			}
		}
	}

	return bizHasRegSched;
};

const getTodayDayIdx = () => {
	const date = new Date();
	const day = date.getDay() + 1;

	return day.toString();
};

async function sendNotification(
	bizId,
	bizName,
	event,
	action,
	orderId,
	reasonsDeclineCancel,
	scheduleId,
	dayOfWeekIdx,
	recurring,
	endTime,
	defaultPrice,
	itemName,
	emoji,
	originalPrice
) {
	// * URL for sending notifications to heroku
	const baseUrl = "https://restoq.herokuapp.com/";
	const notificationEndPoint = "sendNotification";
	const notificationUrl = baseUrl + notificationEndPoint;

	// * Handle sending out notifications for flash schedule
	if (event === "flash" || event === "regular") {
		//* Check if notification has been recently sent
		const lastNotifSent = await getRecentNotif(bizId);

		if (lastNotifSent) {
			const date = new Date();
			const epochTime = Date.parse(date);
			const twentyMinInMili = 25 * 60 * 1000;
			const bufferNotifTime = lastNotifSent + twentyMinInMili;

			if (epochTime <= bufferNotifTime) {
				console.log("epoch", epochTime);
				console.log("bufferNotifTime", bufferNotifTime);
				return;
			}
		}

		const customerFavesRef = collection(db, "biz", bizId, "customerFaves");
		const customerFavesSnap = await getDocs(customerFavesRef);
		const percentDiscountStr = calculateDiscount(defaultPrice, originalPrice);
		let customerIdArr = [];
		let usersTokenArrAll = [];

		// * Loop through customerFaves collection to get array of customerId's who favorited
		customerFavesSnap.forEach((doc) => {
			const data = doc.data();
			const docId = doc.id;

			customerIdArr.push(docId);
		});

		console.log("customerIdArr", customerIdArr);

		// * If favorited customers is less than 50, send to nearby 50.
		const numOfCustomers = customerIdArr.length;
		if (numOfCustomers < 51) {
			const nearbyUserIdArr = await getNearbyUserId(bizId, customerIdArr);
			customerIdArr = [...customerIdArr, ...nearbyUserIdArr];
		}

		console.log("got customer idArr");

		// * Loop through customerIdArr to find userTokens of each customer.
		for (let i = 0; i < customerIdArr.length; i++) {
			const currId = customerIdArr[i];
			const userDocRef = doc(db, "userTokens", currId);
			const userSnap = await getDoc(userDocRef);

			const data = userSnap.data();
			const tokenArr = data.tokens;
			usersTokenArrAll = [...usersTokenArrAll, ...tokenArr];
		}

		if (usersTokenArrAll.length === 0) {
			return;
		} else if (usersTokenArrAll.length >= 1000) {
			const tokenArrSize = 999;

			await updateLastNotifSent(bizId);

			for (let i = 0; i < usersTokenArrAll.length; i += tokenArrSize) {
				const usersTokenArr = usersTokenArrAll.slice(i, i + tokenArrSize);

				let data = {};

				// * Data for push notifications
				if (event === "flash") {
					const pickupByTime = new Date(endTime).toLocaleTimeString("en-US", {
						hour: "2-digit",
						minute: "2-digit",
					});

					var removeLeadingZeroTime = pickupByTime.replace(/^0(?:0:0?)?/, "");

					data = {
						tokens: usersTokenArr,
						title: "NextPlate",
						msg: `${emoji} ${bizName} has a ${itemName} for ${percentDiscountStr} off! Offer available until ${removeLeadingZeroTime}. Grab it before it's gone!`,
						senderName: bizName,
						senderId: bizId,
						dataType: event,
					};
				}

				if (event === "regular") {
					if (recurring) {
						data = {
							tokens: usersTokenArr,
							title: "NextPlate",
							msg: `${emoji} ${bizName} has a ${itemName} for ${percentDiscountStr} off! Grab it before it's gone!`,
							senderName: bizName,
							senderId: bizId,
							dataType: "flash",
						};
					} else {
						data = {
							tokens: usersTokenArr,
							title: "NextPlate",
							msg: `${emoji} ${bizName} has a ${itemName} for ${percentDiscountStr} off! Grab it before it's gone!`,
							senderName: bizName,
							senderId: bizId,
							dataType: "flash",
						};
					}
				}

				// * Send push notifications
				return fetch(notificationUrl, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				})
					.then((data) => {
						const status = data.status;
						console.log("notifs sent");

						return { success: true };
					})
					.catch((error) => {
					console.log("notification", error);
						return { success: false, error };
					});
			}
		}
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
			const pickupByTime = new Date(endTime).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			});

			var removeLeadingZeroTime = pickupByTime.replace(/^0(?:0:0?)?/, "");

			data = {
				tokens: userTokens,
				title: "NextPlate Order Confirmed",
				msg: `${bizName} has confirmed your order. Please pick up your order before ${removeLeadingZeroTime}. Your order may be canceled without a refund if the pickup time is missed.`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		// * SMS for Declined or Canceled order
		if (action === "Declined" || action === "Canceled") {
			// const { isSuccess, customerPhone } = await getCustomerPhone(
			// 	bizId,
			// 	orderId
			// );

			// if (isSuccess) {
			// 	const smsRes = await sendSMS(
			// 		action,
			// 		customerPhone,
			// 		bizName,
			// 		reasonsDeclineCancel
			// 	);
			// 	const { success } = smsRes;
			// 	if (success) {
			// 		return true;
			// 	} else {
			// 		return false;
			// 	}
			// } else {
			// 	return false;
			// }
			data = {
				tokens: userTokens,
				title: "NextPlate Order Declined",
				msg: `${bizName} has declined your order. You were not charged for this order. Reason for decline: (${reasonsDeclineCancel})`,
				senderName: bizName,
				senderId: bizId,
				dataType: event,
			};
		}

		// * Push notification for cancel order
		if (action === "Canceled") {
			data = {
				tokens: userTokens,
				title: "NextPlate Order Canceled",
				msg: `${bizName} has canceled your order. The pickup window has passed and this order will not be refunded.`,
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
				console.log("notification response to order error", error);
				return { success: false, error };
			});
	}
}

const getRecentNotif = async (bizId) => {
	const docRef = doc(db, "biz", bizId);
	const snapShot = await getDoc(docRef);

	if (!snapShot.exists()) {
		return null;
	}

	const data = snapShot.data();
	const lastNotifSent = data.lastNotifSent;

	if (!lastNotifSent) {
		return null;
	}

	return lastNotifSent;
};

const updateLastNotifSent = async (bizId) => {
	const docRef = doc(db, "biz", bizId);
	const date = new Date();
	const epoch = Date.parse(date);

	console.log("updateLastNotif");

	await updateDoc(
		docRef,
		{
			lastNotifSent: epoch,
		},
		{ merge: true }
	);
};

const calculateDiscount = (defaultPrice, originalPrice) => {
	const defaultPriceNoDollar = defaultPrice.substring(1);
	const originalPriceNoDollar = originalPrice.substring(1);
	const defaultPriceNum = parseFloat(defaultPriceNoDollar);
	const originalPriceNum = parseFloat(originalPriceNoDollar);
	const decimalDiscount =
		(originalPriceNum - defaultPriceNum) / originalPriceNum;
	const roundedDiscount = decimalDiscount.toFixed(2) * 100;
	const percentDiscountStr = Math.round(roundedDiscount).toString() + "%";

	return percentDiscountStr;
};

const sendSMS = async (
	action,
	customerPhone,
	bizName,
	reasonsDeclineCancel
) => {
	const baseUrl = "https://ness-twilio.herokuapp.com/";
	const endPoint = "sendSMS";
	const smsUrl = baseUrl.concat(endPoint);
	let smsData = {};

	switch (action) {
		case "Declined":
			smsData = {
				recipient: customerPhone,
				msg: `${bizName} has declined your order. You were not charged for this order. Reason for decline: (${reasonsDeclineCancel})`,
			};
			break;
		case "Canceled":
			smsData = {
				recipient: customerPhone,
				msg: `${bizName} has canceled your order. You were not charged for this order.`,
			};
			break;

		default:
			break;
	}
	console.log("smsData", smsData);

	return fetch(smsUrl, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(smsData),
	})
		.then((data) => {
			console.log("success data", data);
			const status = data.status;

			if (status === 200) {
				return { success: true, status };
			} else {
				return { success: false, status };
			}
		})
		.catch((error) => {
			console.log("error data", error);
			return { success: false, error };
		});
};

export default sendNotification;
export { sendSMS, sendNotifAutomated };
