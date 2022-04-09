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
import { getAuth, updateEmail } from "firebase/auth";
import { db, increment, decrement } from "../../firebase/fireConfig";
import _, { update } from "lodash";
import { getLocalStorage, setLocalStorage } from "../auth/auth";

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
	const isDefault = newItemValues.isDefault;

	const batch = writeBatch(db);

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
		console.log(error);
		return { success: false, message: `Couldn't update product.` };
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
