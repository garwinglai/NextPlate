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

async function getAllUsers() {
	const userDocRef = collection(db, "users");
	try {
		const userSnapshot = await getDocs(userDocRef);
		const userArray = [];

		userSnapshot.forEach((doc) => {
			const data = doc.data();

			userArray.push(data);
		});

		return { success: true, users: userArray.length };
	} catch (error) {
		console.log("error getting all users", error);
		return { success: false, message: `Error fetching users. ${error}` };
	}
}

const getCustomerPhone = async (bizId, orderId) => {
	console.log(bizId, orderId);
	const bizOrderRef = doc(db, "biz", bizId, "orders", orderId);
	const bizOrderSnap = await getDoc(bizOrderRef);

	if (bizOrderSnap.exists()) {
		const bizOrderData = bizOrderSnap.data();
		const phone = bizOrderData.customerPhone;
		const customerPhone = phone.slice(1);

		return { isSuccess: true, customerPhone };
	} else {
		return { isSuccess: false };
	}
};

export default getAllUsers;
export { getCustomerPhone };
