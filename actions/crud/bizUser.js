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
import fetch from "isomorphic-fetch";

// * CRUD --------------------------------------------------

async function checkEmailInUse(email) {
	const userEmailRef = doc(db, "emailsInUse", email);
	const userEmailDocSnap = await getDoc(userEmailRef);

	if (userEmailDocSnap.exists()) {
		return { success: false, message: "Email in use. Please sign in." };
	} else {
		return { success: true };
	}
}

async function createBizUser(newBusiness, uid) {
	const {
		name,
		login: { email, password },
		ownerContact: { firstName, lastName },
	} = newBusiness;

	// Get a new write batch
	const batch = writeBatch(db);

	const docRef = doc(db, "bizEmailsInUse", email);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return { message: "Business email already in use.", success: false };
	} else {
		const bizDocRef = doc(collection(db, "biz"));
		const bizId = bizDocRef.id;
		const lowerBizId = _.toLower(bizId);

		// Check if inviteCode exits. If so, increment
		let inviteCodeNum;
		const capFirstName = _.upperCase(firstName);
		const fNameDocRef = doc(db, "firstNames", capFirstName);

		const fNameDocSnap = await getDoc(fNameDocRef);
		if (fNameDocSnap.exists()) {
			const data = fNameDocSnap.data();
			const num = data.num;
			inviteCodeNum = num + 1;
			// Increment firstNames
			batch.update(fNameDocRef, { num: increment });
		} else {
			inviteCodeNum = 0;
			batch.set(fNameDocRef, { num: 0 });
		}

		// Add bizId to keywords array for search
		newBusiness.keywords = [...newBusiness.keywords, lowerBizId];

		// Create new stripe id for user
		let stripeId;
		let baseUrl = "https://restoq.herokuapp.com/";
		const capturePaymentVisa = "customerNP";

		baseUrl = baseUrl.concat(capturePaymentVisa);
		const data = { email, origin: "web_biz" };

		try {
			const res = await fetch(baseUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const resText = await res.text();
			const resJson = JSON.parse(resText);
			const status = res.status;
			console.log(status);

			if (status === 200) {
				stripeId = resJson.id;
			} else {
				return { success: false, message: "Unable to create stripe id." };
			}
		} catch (error) {
			return { success: false, error };
		}

		// TODO: stripe id -> status 200, but no stripeId returned from data

		const users = {
			createdAt: new serverTimestamp(),
			currentLocation: {
				lastUpdated: 0,
				locLat: 0,
				locLong: 0,
				locName: "",
			},
			device: "Web Biz",
			email,
			firstName,
			hasSignUpReward: true,
			inviteCode: capFirstName + inviteCodeNum,
			lastName,
			stripeId,
			tokens: [],
			watchListIds: [],
			bizOwned: { [bizId]: { id: bizId, name } },
		};

		// Create users doc for biz
		const userRef = doc(db, "users", uid);
		batch.set(userRef, users);

		// Set/create biz document
		const bizRef = doc(db, "biz", bizId);
		batch.set(bizRef, newBusiness);

		// Set invite codes
		const inviteCodeRef = doc(db, "inviteCodes", users.inviteCode);
		batch.set(inviteCodeRef, { userId: uid });

		// Set recover pw
		const recoveryRef = doc(db, "recovery", uid);
		batch.set(recoveryRef, { info: password });

		// set email in use
		const emailRef = doc(db, "emailsInUse", email);
		batch.set(emailRef, { createdAt: new serverTimestamp() });

		// Update biz email in use
		const bizEmailRef = doc(db, "bizEmailsInUse", email);
		batch.set(bizEmailRef, { createdAt: new serverTimestamp() });

		// Commit the batch
		try {
			await batch.commit();
			return {
				message: "Business created successfully",
				success: true,
			};
		} catch (error) {
			return { success: false, message: "Error batch commit: ", error };
		}
	}
}

async function updateBizUserAdmin(
	uid,
	bizId,
	updatedBiz,
	changeBizName,
	changeFirstName,
	changeLastName,
	prevFirstName
) {
	// Get a new write batch
	const batch = writeBatch(db);

	// * Update biz users
	const userRef = doc(db, "users", uid);

	if (changeLastName) {
		batch.update(
			userRef,
			{ lastName: updatedBiz.ownerContact.lastName },
			{ merge: true }
		);
	}

	if (changeBizName) {
		batch.update(
			userRef,
			{ [`bizOwned.${bizId}.name`]: updatedBiz.name },
			{ merge: true }
		);
	}

	if (changeFirstName) {
		const newNameCap = _.upperCase(updatedBiz.ownerContact.firstName);
		const newFNameDocRef = doc(db, "firstNames", newNameCap);

		let inviteCodeNum;

		// * Check if new firstName doc exists, if so increment, if not add firstName @ num=0
		const newFNameDocSnap = await getDoc(newFNameDocRef);
		if (newFNameDocSnap.exists()) {
			const data = newFNameDocSnap.data();
			const num = data.num;
			inviteCodeNum = num + 1;
			// Increment firstNames
			batch.update(newFNameDocRef, { num: increment });
		} else {
			inviteCodeNum = 0;
			batch.set(newFNameDocRef, { num: 0 });
		}

		const inviteCode = updatedBiz.ownerContact.firstName + inviteCodeNum;

		// * invteCodes collection -> delete old one, create new one linked to uid
		let prevInviteCode;

		const userDocSnap = await getDoc(userRef);
		if (userDocSnap.exists()) {
			const userData = userDocSnap.data();
			prevInviteCode = userData.inviteCode;
		} else {
			return { success: false, message: "Could not find user." };
		}

		// Delete old invite code
		const oldInviteCodeRef = doc(db, "inviteCodes", prevInviteCode);
		batch.delete(oldInviteCodeRef);

		// Set new inviteCode for fName change
		const inviteCodeRef = doc(db, "inviteCodes", inviteCode);
		batch.set(inviteCodeRef, { userId: uid });

		// * Update Users collection firstName & inviteCode
		batch.update(
			userRef,
			{
				firstName: updatedBiz.ownerContact.firstName,
				inviteCode,
			},
			{ merge: true }
		);
	}

	// Update biz document
	const bizRef = doc(db, "biz", bizId);
	batch.update(bizRef, updatedBiz);

	// Commit the batch
	try {
		await batch.commit();
		return { success: true, message: "Successfully updated user" };
	} catch (error) {
		return { success: false, message: "Error: ", error };
	}
}

// * additionalChange = bool is param for changes in firstName, login, & bizName, which requires changes in multiple docs
async function updateBizDataUser(
	uid,
	bizId,
	name,
	updatedData,
	additionalChange,
	oldLoginEmail,
	storedUser
) {
	const bizDataDocRef = doc(db, "biz", bizId);
	const userRef = doc(db, "users", uid);

	const batch = writeBatch(db);

	if (name === "form1") {
		const { firstName, lastName, ownerPhoneNumber } = updatedData;
		const firstNameCapFirst = _.capitalize(firstName);
		const lastNameCapFirst = _.capitalize(lastName);
		console.log(updatedData);

		if (additionalChange) {
			const newNameCap = _.upperCase(firstName);
			const newFNameDocRef = doc(db, "firstNames", newNameCap);

			let inviteCodeNum;

			// * Check if new firstName doc exists, if so increment, if not add firstName @ num=0
			const newFNameDocSnap = await getDoc(newFNameDocRef);
			if (newFNameDocSnap.exists()) {
				const data = newFNameDocSnap.data();
				const num = data.num;
				inviteCodeNum = num + 1;
				// Increment firstNames
				batch.update(newFNameDocRef, { num: increment });
			} else {
				inviteCodeNum = 0;
				batch.set(newFNameDocRef, { num: 0 });
			}

			const inviteCode = firstNameCapFirst + inviteCodeNum;

			// * invteCodes collection -> delete old one, create new one linked to uid
			let prevInviteCode;

			const userDocSnap = await getDoc(userRef);
			if (userDocSnap.exists()) {
				const userData = userDocSnap.data();
				prevInviteCode = userData.inviteCode;
			} else {
				return { success: false, message: "Could not find user." };
			}

			// Delete old invite code
			const oldInviteCodeRef = doc(db, "inviteCodes", prevInviteCode);
			batch.delete(oldInviteCodeRef);

			// Set new inviteCode for fName change
			const inviteCodeRef = doc(db, "inviteCodes", inviteCode);
			batch.set(inviteCodeRef, { userId: uid });

			// * Update Users collection firstName, lastName, & inviteCode
			batch.update(userRef, {
				firstName: firstNameCapFirst,
				lastName: lastNameCapFirst,
				inviteCode,
			});

			// * Update bizData
			batch.update(bizDataDocRef, {
				"ownerContact.firstName": firstNameCapFirst,
				"ownerContact.lastName": lastNameCapFirst,
				"ownerContact.phoneNumber": ownerPhoneNumber,
			});

			// * Update localStorage
			storedUser.firstName = firstNameCapFirst;
			storedUser.lastName = lastNameCapFirst;
			storedUser.inviteCode = inviteCode;
			setLocalStorage("user", storedUser);
		} else {
			batch.update(bizDataDocRef, {
				"ownerContact.lastName": lastNameCapFirst,
				"ownerContact.phoneNumber": ownerPhoneNumber,
			});

			batch.update(userRef, {
				lastName: lastNameCapFirst,
			});

			// * Update localStorage
			storedUser.lastName = lastNameCapFirst;
			setLocalStorage("user", storedUser);
		}
	}

	if (name == "form2") {
		const {
			itemName,
			itemDescription,
			loginEmail,
			originalPrice,
			defaultPrice,
			allergens,
		} = updatedData;

		if (additionalChange) {
			// * Update loginEmail

			// * Check if email exists
			const emailDocRef = doc(db, "emailsInUse", loginEmail);
			const bizEmailsDocRef = doc(db, "bizEmailsInUse", loginEmail);
			const emailDocSnap = await getDoc(emailDocRef);

			if (emailDocSnap.exists()) {
				return { success: false, message: `Email already exists.` };
			}

			const oldEmailDocRef = doc(db, "emailsInUse", oldLoginEmail);
			const oldBizEmailDocRef = doc(db, "bizEmailsInUse", oldLoginEmail);
			const auth = getAuth();
			return updateEmail(auth.currentUser, loginEmail)
				.then(() => {
					batch.update(bizDataDocRef, {
						"login.email": loginEmail,
						"storeContact.email": loginEmail,
						"ownerContact.email": loginEmail,
						itemName,
						itemDescription,
						originalPrice,
						defaultPrice,
						allergens,
					});

					batch.delete(oldEmailDocRef);
					batch.delete(oldBizEmailDocRef);

					batch.update(userRef, { email: loginEmail });
					batch.set(emailDocRef, { createdAt: new serverTimestamp() });
					batch.set(bizEmailsDocRef, { createdAt: new serverTimestamp() });
				})
				.then(() => batch.commit())
				.then(() => {
					const ifEmailRemembered = getLocalStorage("rememberedEmail");

					if (ifEmailRemembered && ifEmailRemembered !== "") {
						setLocalStorage("rememberedEmail", loginEmail);
					}

					storedUser.email = loginEmail;
					setLocalStorage("user", storedUser);

					return { success: true };
				})
				.catch((e) => {
					console.log(e);
					return { success: false, message: `Could not update login email.` };
				});
		} else {
			// * Update itemName + itemDescription
			batch.update(bizDataDocRef, {
				itemName,
				itemDescription,
				originalPrice,
				defaultPrice,
				allergens,
			});
		}
	}

	if (name === "form3") {
		const { bizName, bizPhoneNumber, website, address } = updatedData;

		if (additionalChange) {
			// * Update biz data
			batch.update(bizDataDocRef, {
				name: bizName,
				website: website,
				"storeContact.phoneNumber": bizPhoneNumber,
				"address.fullAddress": address.fullAddress,
				"address.address_1": address.address_1,
				"address.address_2": address.address_2,
				"address.city": address.city,
				"address.state": address.state,
				"address.zip": address.zip,
			});

			// * Update biz User data
			batch.update(userRef, {
				[`bizOwned.${bizId}.name`]: bizName,
			});

			storedUser.bizOwned[bizId].name = bizName;
			setLocalStorage("user", storedUser);
		} else {
			batch.update(bizDataDocRef, {
				website: website,
				"storeContact.phoneNumber": bizPhoneNumber,
				"address.fullAddress": address.fullAddress,
				"address.address_1": address.address_1,
				"address.address_2": address.address_2,
				"address.city": address.city,
				"address.state": address.state,
				"address.zip": address.zip,
			});
		}
	}

	try {
		await batch.commit();
		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false, message: `Could not update information.` };
	}
}

async function addBizTextNumbers({
	name,
	noHyphenSpaceNumber,
	uid,
	bizId,
	action,
}) {
	const bizDocRef = doc(db, "biz", bizId);
	console.log("server", noHyphenSpaceNumber);

	if (action === "add") {
		const resBizDocSnap = await getDoc(bizDocRef);
		const data = resBizDocSnap.data();
		const txtNumbers = data.textNumbers;
		console.log(txtNumbers);

		for (let key in txtNumbers) {
			if (noHyphenSpaceNumber === key) {
				return { success: false, message: "Number is already in use." };
			}
		}

		try {
			const res = await updateDoc(bizDocRef, {
				[`textNumbers.${noHyphenSpaceNumber}`]: {
					name: name,
					number: noHyphenSpaceNumber,
					isSelected: false,
				},
			});

			return { success: true, message: "New phone number added." };
		} catch (error) {
			console.log(error);
			return { success: false, message: "Error adding phone number." };
		}
	}
}

async function updateBizTextNumbers(updates, bizId) {
	const bizDocRef = doc(db, "biz", bizId);
	try {
		await updateDoc(bizDocRef, { textNumbers: updates });
		return { success: true, message: `Successfully updated.` };
	} catch (error) {
		return { success: false, message: "Error updating." };
	}
}

async function deleteBizUser(bizId) {
	try {
		await deleteDoc(doc(db, "biz", bizId));
		return { success: true, message: "Business user successfully deleted" };
	} catch (error) {
		return { success: false, message: "Error with deleting user: ", error };
	}
}

async function getAllBizUserInfo() {
	try {
		const bizArr = [];
		const businessesRef = collection(db, "biz");
		const q = query(businessesRef, orderBy("name"), limit(10));
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const bizId = doc.id;
			bizArr.push([data, bizId]);
		});

		return { bizArr, success: true };
	} catch (error) {
		return {
			message: `Problem with getting all business users' data. Error: ${error}`,
			succes: false,
		};
	}
}

async function getBizUserNew(uid) {
	const userRef = doc(db, "users", uid);
	const userRefSnap = await getDoc(userRef);

	if (userRefSnap.exists()) {
		const userData = userRefSnap.data();
		userData.createdAt = "";
		userData.currentLocation = "";
		userData.hasSignUpReward = "";
		userData.stripeId = "";
		userData.tokens = "";
		userData.watchListIds = "";
		return { success: true, userData };
	} else {
		return { success: false, message: "User now found." };
	}
}

async function getBiz(bizId, dateArr) {
	// * Get Orders within dateArr
	let ordersArr = [];

	if (dateArr && dateArr.length !== 0) {
		const ordersRef = collection(db, "biz", bizId, "orders");
		const q = query(ordersRef, where("shortDate", "in", dateArr));

		try {
			const ordersSnapShot = await getDocs(q);
			ordersSnapShot.forEach((doc) => {
				const data = doc.data();
				ordersArr.push(data);
			});
		} catch (error) {
			return { success: false, message: `Error fetching orders: ${error}` };
		}
	}

	// * Get Biz User
	const docRef = doc(db, "biz", bizId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		const docData = docSnap.data();
		return { success: true, docData, ordersArr };
	} else {
		return {
			success: false,
			message: `Business user does not exist.`,
		};
	}
}

async function queryBizUser(searchQuery) {
	let keywordArrayCombinations = [];
	const keywordArray = searchQuery.split();
	const keywordArraySplit = searchQuery.split(" ");
	const keywordLen = keywordArraySplit.length;

	const keywordSplitCombinations = keywordArraySplit.reduce(
		(acc, v, i) =>
			acc.concat(keywordArraySplit.slice(i + 1).map((w) => v + " " + w)),
		[]
	);

	if (keywordLen === 1) {
		keywordArrayCombinations = keywordArray;
	} else if (keywordLen === 2) {
		keywordArrayCombinations =
			keywordSplitCombinations.concat(keywordArraySplit);
	} else if (keywordLen > 2) {
		keywordArrayCombinations = keywordArraySplit
			.concat(keywordSplitCombinations)
			.concat(keywordArray);
	}

	try {
		const bizRef = collection(db, "biz");
		const q = query(
			bizRef,
			where("keywords", "array-contains-any", keywordArrayCombinations)
		);
		const querySnapshot = await getDocs(q);
		const queryBizArray = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const uid = doc.id;
			queryBizArray.push([data, uid]);
		});
		return { success: true, queryBizArray };
	} catch (error) {
		return { success: false, message: "Error with search: ", error };
	}
}

async function getBizAdminPagination(round, lastDoc) {
	const businessesRef = collection(db, "biz");
	let queryRound;

	if (round === "prev") {
		queryRound = query(
			businessesRef,
			orderBy("name"),
			endBefore(lastDoc),
			limitToLast(10)
		);
	} else if (round === "next") {
		queryRound = query(
			businessesRef,
			orderBy("name"),
			startAfter(lastDoc),
			limit(10)
		);
	} else if (round === "last") {
		queryRound = query(
			businessesRef,
			orderBy("name"),
			endAt(lastDoc),
			limitToLast(10)
		);
	}

	try {
		let businessArr = [];
		const businessRefDocSnap = await getDocs(queryRound);
		businessRefDocSnap.forEach((doc) => {
			const data = doc.data();
			const bizId = doc.id;
			businessArr.push([data, bizId]);
		});
		return { success: true, businessArr };
	} catch (error) {
		return { success: false, message: `Could not fetch new data: ${error}` };
	}
}

async function addBankNumber(bizId, bankInfo) {
	const bizDocRef = doc(db, "biz", bizId);

	try {
		await updateDoc(bizDocRef, {
			[`bankInfo.${bankInfo.routingNumber}`]: bankInfo,
		});
		return { success: true, message: `Successfully added bank information.` };
	} catch (error) {
		console.log(error);
		return { success: false, message: `Error adding bank information.` };
	}
}

async function removeBankNumber(bizId, routingNumber) {
	const bizDocRef = doc(db, "biz", bizId);

	try {
		await updateDoc(bizDocRef, {
			[`bankInfo.${routingNumber}`]: deleteField(),
		});

		return { success: true, message: `Successfully deleted bank information.` };
	} catch (error) {
		return { success: false, message: `Error deleting bank information.` };
	}
}

export default createBizUser;
export {
	getAllBizUserInfo,
	getBizAdminPagination,
	getBiz,
	getBizUserNew,
	updateBizUserAdmin,
	updateBizDataUser,
	deleteBizUser,
	queryBizUser,
	checkEmailInUse,
	addBizTextNumbers,
	updateBizTextNumbers,
	addBankNumber,
	removeBankNumber,
};
