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
	console.log("hi");
	try {
		const userSnapshot = await getDocs(userDocRef);
		const userArray = [];

		userSnapshot.forEach((doc) => {
			const data = doc.data();

			userArray.push(data);
		});
		console.log(userArray);
		return { success: true, users: userArray.length };
	} catch (error) {
		console.log("error getting all users", error);
		return { success: false, message: `Error fetching users. ${error}` };
	}
}

export default getAllUsers;
