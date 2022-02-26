import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	updateEmail,
	updatePassword,
	reauthenticateWithCredential,
	EmailAuthProvider,
	sendPasswordResetEmail,
} from "firebase/auth";
import cookie from "js-cookie";

// * AUTH --------------------------------------------------

function isAuth() {
	if (typeof window !== "undefined") {
		const adminUid = getCookie("adminUid");
		const uid = getCookie("uid");
		if (getCookie("uid")) {
			if (getLocalStorage("user")) {
				const user = JSON.parse(getLocalStorage("user"));
				return { uid, user };
			}
		}

		if (getCookie("adminUid")) {
			if (getLocalStorage("admin")) {
				const admin = JSON.parse(getLocalStorage("admin"));
				return { adminUid, admin };
			}
		}
	}
	return false;
}

async function signUpAdmin({ email, password }) {
	const auth = getAuth();
	// let user;
	const docRef = doc(db, "adminEmailsInUse", email);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		return { message: "Email already in use.", success: false };
	} else {
		return createUserWithEmailAndPassword(auth, email, password)
			.then((userCredential) => {
				return { message: "Signed up successfully", success: true };
			})
			.catch((error) => {
				const errorCode = error.code;
				// const errorMessage = error.message;
				if (errorCode === "auth/email-already-in-use") {
					return { message: "Email already in use.", success: false };
				} else {
					return {
						message: `Problem signing up. Please try again. Error: ${errorCode}`,
						success: false,
					};
				}
			});
	}
}

async function signInAdmin({ email, password }) {
	const auth = getAuth();

	const docRef = doc(db, "adminEmailsInUse", email);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return signInWithEmailAndPassword(auth, email, password)
			.then((userCred) => {
				// Signed in
				const { user } = userCred;
				const uid = user.uid;
				const localStoredUser = {
					email: user.email,
				};

				setCookie("adminUid", uid);
				setLocalStorage("admin", localStoredUser);

				return { success: true };
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				return { message: `Error signing in: ${errorCode}`, success: false };
			});
	} else {
		return {
			message: "Please sign in with an admin email.",
			success: false,
		};
	}
}

async function timeOutReauthenticate(password) {
	const auth = getAuth();
	const user = auth.currentUser;
	console.log(user);

	if (user) {
		// TODO(you): prompt the user to re-provide their sign-in credentials
		const credential = EmailAuthProvider.credential(user.email, password);

		return reauthenticateWithCredential(user, credential)
			.then(() => {
				console.log("worked");
				return { success: true };
			})
			.catch((error) => {
				console.log(error);
				return { success: false, message: "Wrong password." };
			});
	} else {
		return { success: false, message: `User not found. Please re-login.` };
	}
}

async function signUpBiz({ email, password }) {
	const auth = getAuth();

	const docRef = doc(db, "bizEmailsInUse", email);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return { message: "Business email already in use.", success: false };
	} else {
		return createUserWithEmailAndPassword(auth, email, password)
			.then((userCredential) => {
				const { user } = userCredential;
				const uid = user.uid;
				return {
					message: "Successfully signed up business as user.",
					success: true,
					uid,
				};
			})
			.catch((error) => {
				const errorCode = error.code;
				// const errorMessage = error.message;
				if (errorCode === "auth/email-already-in-use") {
					return { message: "Auth/Email already in use.", success: false };
				} else {
					return {
						message: `Problem signing up. Please try again. Error ${errorCode}`,
						success: false,
					};
				}
			});
	}
}

async function signInBiz({ email, password, rememberMe }) {
	const auth = getAuth();
	const docRef = doc(db, "bizEmailsInUse", email);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		const docData = docSnap.data();

		return signInWithEmailAndPassword(auth, email, password)
			.then((userCred) => {
				// Signed in

				const { user } = userCred;

				const uid = user.uid;

				if (rememberMe) {
					setLocalStorage("rememberedEmail", user.email);
				} else {
					removeLocalStorage("rememberedEmail");
				}

				setCookie("uid", uid);
				return { success: true, uid };
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				return {
					message: "Incorrect password.",
					success: false,
				};
			});
	} else {
		return {
			success: false,
			message: "Email not found.",
		};
	}
}

async function signOutUser() {
	const auth = getAuth();
	return signOut(auth)
		.then(() => {
			removeLocalStorage("user");
			removeCookie("uid");
			removeLocalStorage("uid");
			removeLocalStorage("admin");
			removeCookie("adminUid");
			return { success: true };
		})
		.catch((error) => {
			return { success: false, message: "Error signing out. Try again." };
		});
}

async function updateSignInEmail(updatedEmail) {
	// * First check if email exists.
	const emailsDocRef = doc(db, "emailsInUse", updatedEmail);
	const emailDocSnap = await getDoc(emailsDocRef);

	if (emailDocSnap.exists()) {
		return { success: false, message: "Email in use." };
	}

	const auth = getAuth();
	return updateEmail(auth.currentUser, updatedEmail)
		.then((user) => {
			// Email updated!
			console.log(`Update login email: ${user.uid}`);
			return { success: true };
		})
		.catch((error) => {
			// An error occurred
			return {
				success: false,
				message: `Error updating login email. Error: ${error}`,
			};
		});
}

async function updateSignInPassword(password) {
	const auth = getAuth();

	const user = auth.currentUser;
	const newPassword = password;

	return updatePassword(user, newPassword)
		.then(() => {
			console.log("Work");
			return { success: true };
		})
		.catch((error) => {
			console.log(error);
			return { success: false, message: `Could not update password.` };
		});
}

async function forgotPassword(email) {
	const auth = getAuth();
	return sendPasswordResetEmail(auth, email)
		.then(() => {
			return { success: true };
		})
		.catch((error) => {
			const errorMessage = error.message;
			return {
				success: false,
				message: `Error sending password reset email: ${errorMessage}`,
			};
		});
}

//localStorage
function setLocalStorage(key, value) {
	if (typeof window !== "undefined") {
		localStorage.setItem(key, JSON.stringify(value));
	}
}

function removeLocalStorage(key) {
	if (typeof window !== "undefined") {
		localStorage.removeItem(key);
	}
}

function getLocalStorage(key) {
	if (typeof window !== "undefined") {
		return localStorage.getItem(key);
	}
}

function setSessionStorage(key, value) {
	if (typeof window !== "undefined") {
		sessionStorage.setItem(key, JSON.stringify(value));
	}
}

function getSessionStorage(key) {
	if (typeof window !== "undefined") {
		return sessionStorage.getItem(key);
	}
}

function removeSessionStorage(key) {
	if (typeof window !== "undefined") {
		sessionStorage.removeItem(key);
	}
}

//set cookie
function setCookie(key, value) {
	if (typeof window !== "undefined") {
		cookie.set(key, value, { expires: 100000 });
	}
}

function removeCookie(key) {
	if (typeof window !== "undefined") {
		cookie.remove(key, { expires: 100000 });
	}
}

function getCookie(key) {
	if (typeof window !== "undefined") {
		return cookie.get(key);
	}
}

export {
	signInAdmin,
	signUpAdmin,
	signInBiz,
	signUpBiz,
	signOutUser,
	updateSignInEmail,
	isAuth,
	getLocalStorage,
	removeLocalStorage,
	setLocalStorage,
	getCookie,
	setSessionStorage,
	getSessionStorage,
	removeSessionStorage,
	timeOutReauthenticate,
	updateSignInPassword,
	forgotPassword,
};
