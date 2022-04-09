import { db } from "../../firebase/fireConfig";
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

// * Add to Email Lists --------------------------------------------------

async function addAdminEmails(email, adminUid, adminPassword) {
	const newAdminDoc = doc(db, "admin", adminUid);
	const emailDoc = doc(db, "emailsInUse", email);
	const adminEmailDoc = doc(db, "adminEmailsInUse", email);

	const batch = writeBatch(db);
	batch.set(newAdminDoc, {
		email: email,
		numOrders: 0,
		recover: adminPassword,
	});
	batch.set(emailDoc, { createdAt: new serverTimestamp() });
	batch.set(adminEmailDoc, { createdAt: new serverTimestamp() });

	try {
		await batch.commit();
		return { success: true };
	} catch (error) {
		return {
			success: false,
			message: "Error adding admin email to firestore.",
		};
	}
}

async function addEmailsInUse(email) {
	try {
		await setDoc(doc(db, "emailsInUse", email), {
			createdAt: new serverTimestamp(),
		});
		return { success: true };
	} catch (error) {
		return {
			success: false,
			message: `Error adding to emailInUse list: ${error}`,
		};
	}
}

async function addAdminEmailsInUse(email) {
	try {
		await setDoc(doc(db, "adminEmailsInUse", email), {
			createdAt: new serverTimestamp(),
		});
		return { success: true };
	} catch (error) {
		return {
			success: false,
			message: `Error adding to admin email: ${error}`,
		};
	}
}

async function addBusinessEmailsInUse(email) {
	try {
		await setDoc(doc(db, "bizEmailsInUse", email), {
			createdAt: new serverTimestamp(),
		});
		return { success: true };
	} catch (error) {
		return {
			success: false,
			message: `Error adding to business email: ${error}`,
		};
	}
}

export {
	addAdminEmails,
	addEmailsInUse,
	addAdminEmailsInUse,
	addBusinessEmailsInUse,
};
