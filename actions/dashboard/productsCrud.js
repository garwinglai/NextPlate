import {
	collection,
	getDocs,
	getDoc,
	doc,
	query,
	orderBy,
	writeBatch,
	serverTimestamp,
	deleteDoc,
	where,
	limit,
	limitToLast,
	endBefore,
	updateDoc,
	endAt,
	startAfter,
	setDoc,
	deleteField,
} from "firebase/firestore";
import { db, increment, decrement } from "../../firebase/fireConfig";
import _, { update } from "lodash";

async function getProducts(bizId) {
	const productsDocRef = collection(db, "biz", bizId, "products");

	try {
		const productsArr = [];
		const productsSnap = await getDocs(productsDocRef);

		productsSnap.forEach((doc) => {
			const data = doc.data();
			productsArr.push(data);
		});

		productsArr.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

		return { success: true, productsArr };
	} catch (error) {
		console.log(error);
		return { success: false, message: `Error getting products.` };
	}
}

async function createNewProduct(bizId, newItemValues) {
	const productsDocRef = doc(collection(db, "biz", bizId, "products"));
	const productId = productsDocRef.id;
	newItemValues.id = productId;
	newItemValues.createdAt = new serverTimestamp();

	try {
		await setDoc(doc(db, "biz", bizId, "products", productId), newItemValues);
		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, message: `Error saving new item: ${error}` };
	}
}

async function updateProduct(bizId, productId, newItemValues) {
	const productDocRef = doc(db, "biz", bizId, "products", productId);
	const bizDocRef = doc(db, "biz", bizId);
	const {
		itemName,
		itemDescription,
		originalPrice,
		defaultPrice,
		allergens,
		isDefault,
		itemImgLink,
		itemLrgImgLink,
	} = newItemValues;

	const batch = writeBatch(db);

	// TODO: update scheduled product
	const weeklySchedules = await getWeeklySchedules(bizDocRef);
	const pausedSchedules = await getPausedSchedules(bizDocRef);

	// console.log("week", weeklySchedules);
	// console.log("pause", pausedSchedules);

	if (weeklySchedules !== null) {
		const daysSchedArr = Object.keys(weeklySchedules);
		console.log("productId", productId);
		for (let i = 0; i < daysSchedArr.length; i++) {
			const day = daysSchedArr[i];
			const schedIdPerDayArr = Object.keys(weeklySchedules[day]);

			for (let j = 0; j < schedIdPerDayArr.length; j++) {
				const schedId = schedIdPerDayArr[j];
				const currSchedule = weeklySchedules[day][schedId];
				const currProductId = currSchedule.productId;
				const itemPriceNoDollarSign = defaultPrice.slice(1);
				const itemPriceDoubleConvert = parseFloat(itemPriceNoDollarSign);
				const itemPricePennyConvert = itemPriceDoubleConvert * 100;
				const itemPricePennyInt = parseInt(itemPricePennyConvert);

				currSchedule.itemName = itemName;
				currSchedule.itemDescription = itemDescription;
				currSchedule.originalPrice = originalPrice;
				currSchedule.itemPrice = defaultPrice;
				currSchedule.itemPriceDouble = itemPriceDoubleConvert;
				currSchedule.itemPricePenny = itemPricePennyInt;
				currSchedule.itemPrice = defaultPrice;
				currSchedule.itemImgLink = itemImgLink;
				currSchedule.itemLrgImgLink = itemLrgImgLink;

				if (currProductId === productId) {
					batch.update(bizDocRef, {
						[`weeklySchedules.${day}.${schedId}`]: currSchedule,
					});
				}
			}
		}
	}

	if (pausedSchedules !== null) {
		const daysSchedArr = Object.keys(pausedSchedules);

		for (let i = 0; i < daysSchedArr.length; i++) {
			const day = daysSchedArr[i];
			const schedIdPerDayArr = Object.keys(pausedSchedules[day]);

			for (let j = 0; j < schedIdPerDayArr.length; j++) {
				const schedId = schedIdPerDayArr[j];
				const currSchedule = pausedSchedules[day][schedId];
				const currProductId = currSchedule.productId;
				const itemPriceNoDollarSign = defaultPrice.slice(1);
				const itemPriceDoubleConvert = parseFloat(itemPriceNoDollarSign);
				const itemPricePennyConvert = itemPriceDoubleConvert * 100;
				const itemPricePennyInt = parseInt(itemPricePennyConvert);

				currSchedule.itemName = itemName;
				currSchedule.itemDescription = itemDescription;
				currSchedule.originalPrice = originalPrice;
				currSchedule.itemPrice = defaultPrice;
				currSchedule.itemPriceDouble = itemPriceDoubleConvert;
				currSchedule.itemPricePenny = itemPricePennyInt;
				currSchedule.itemPrice = defaultPrice;
				currSchedule.itemImgLink = itemImgLink;
				currSchedule.itemLrgImgLink = itemLrgImgLink;

				if (currProductId === productId) {
					batch.update(bizDocRef, {
						[`pausedSchedules.${day}.${schedId}`]: currSchedule,
					});
				}
			}
		}
	}

	if (isDefault) {
		batch.update(productDocRef, newItemValues);
		batch.update(bizDocRef, newItemValues);
	} else {
		batch.update(productDocRef, newItemValues);
	}

	try {
		await batch.commit();

		return { success: true };
	} catch (error) {
		console.log("error updating", error);
		return { success: false, message: `Couldn't update product.` };
	}
}

async function getWeeklySchedules(bizDocRef) {
	const bizSnapshot = await getDoc(bizDocRef);

	if (bizSnapshot.exists()) {
		const bizData = bizSnapshot.data();
		const weeklySchedules = bizData.weeklySchedules;

		if (
			weeklySchedules === undefined ||
			Object.keys(weeklySchedules).length === 0
		) {
			return null;
		}

		return weeklySchedules;
	}
}

async function getPausedSchedules(bizDocRef) {
	const bizSnapshot = await getDoc(bizDocRef);

	if (bizSnapshot.exists()) {
		const bizData = bizSnapshot.data();
		const pausedSchedules = bizData.pausedSchedules;

		if (
			pausedSchedules === undefined ||
			Object.keys(pausedSchedules).length === 0
		) {
			return null;
		}

		return pausedSchedules;
	}
}

async function deleteProduct(bizId, productId) {
	const productDocRef = doc(db, "biz", bizId, "products", productId);
	try {
		await deleteDoc(productDocRef);
		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, message: `Error deleting item: ${error}` };
	}
}

export default getProducts;
export { createNewProduct, deleteProduct, updateProduct };
