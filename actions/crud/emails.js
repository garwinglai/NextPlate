import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/fireConfig";

// * Add to Email Lists --------------------------------------------------

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

export { addEmailsInUse, addAdminEmailsInUse, addBusinessEmailsInUse };
