import { useRadioGroup } from "@mui/material";
import {
	collection,
	getDocs,
	getDoc,
	doc,
	writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import fetch from "isomorphic-fetch";
import getNearbyUserId from "../../helper/GeoHash";

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
	const percentDiscountStr = calculateDiscount(defaultPrice, originalPrice);

	return;
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

		// * If favorited customers is less than 50, send to nearby 50.
		const numOfCustomers = customerIdArr.length;
		if (numOfCustomers < 51) {
			const nearbyUserIdArr = await getNearbyUserId(bizId, customerIdArr);
			customerIdArr = [...customerIdArr, ...nearbyUserIdArr];
		}

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
				return { success: true };
			})
			.catch((error) => {
				console.log("notification", error);
				return { success: false, error };
			});
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

		// * Push notification for declining order
		if (action === "Declined") {
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

export default sendNotification;
