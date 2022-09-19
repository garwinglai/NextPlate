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
import createStripeAccount from "../heroku/stripeAccount";
import { CurrencyYenOutlined } from "@mui/icons-material";

// * CRUD --------------------------------------------------

async function checkEmailInUse(email) {
	const userEmailRef = doc(db, "bizEmailsInUse", email);
	const userEmailDocSnap = await getDoc(userEmailRef);

	if (userEmailDocSnap.exists()) {
		return { success: false, message: "Email in use. Please sign in." };
	} else {
		return { success: true };
	}
}

async function createBizAccount(newBusiness, defaultProduct, uid) {
	const {
		name,
		login: { email, password },
		ownerContact: { firstName, lastName },
	} = newBusiness;

	// Get a new write batch
	const batch = writeBatch(db);

	const docRef = doc(db, "bizEmailsInUse", email);

	const docSnap = await getDoc(docRef);
	let stripeAccountId;

	if (docSnap.exists()) {
		return { message: "Business email already in use.", success: false };
	} else {
		// * Create auto ID for biz
		const bizDocRef = doc(collection(db, "biz"));
		const bizId = bizDocRef.id;

		// * Create auto ID for products
		const productsDocRef = doc(collection(db, "biz", bizId, "products"));
		const productId = productsDocRef.id;

		// Add bizId to keywords array for search and add default productId
		newBusiness.keywords = [...newBusiness.keywords, bizId];
		newBusiness.productId = productId;

		// Create new stripe account for user
		try {
			let resStripe = await createStripeAccount(email);
			if (resStripe.success) {
				stripeAccountId = resStripe.accountId;
			} else {
				return {
					success: false,
					message: `Error with stripe account. ${resStripe.error}`,
				};
			}
		} catch (error) {
			console.log(error);
		}

		const bizAccount = {
			createdAt: new serverTimestamp(),
			device: "Web Biz",
			login: { email, password },
			ownerContact: {
				phoneNumber: newBusiness.ownerContact.phoneNumber,
				email: newBusiness.ownerContact.email,
			},
			firstName,
			lastName,
			bizOwned: { [bizId]: { id: bizId, name, stripeAccountId } },
		};

		// Create bizAccount doc for biz
		const userRef = doc(db, "bizAccount", uid);
		batch.set(userRef, bizAccount);

		// Set/create biz document
		const bizRef = doc(db, "biz", bizId);
		batch.set(bizRef, newBusiness);

		// Set/create products collection for biz
		defaultProduct.id = productId;
		batch.set(productsDocRef, defaultProduct, { merge: true });

		// Set recover pw
		const recoveryRef = doc(db, "recovery", uid);
		batch.set(recoveryRef, { info: password });

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
			console.log(error);
			return { success: false, message: "Error batch commit: ", error };
		}
	}
}

async function createAdditionalBiz(
	newBusiness,
	defaultProduct,
	uid,
	existingBiz
) {
	const {
		name,
		login: { email, password },
		ownerContact: { firstName, lastName },
	} = newBusiness;

	const batch = writeBatch(db);

	// * Create id for biz
	const bizDocRef = doc(collection(db, "biz"));
	const bizId = bizDocRef.id;

	// * Create id for products
	const productsDocRef = doc(collection(db, "biz", bizId, "products"));
	const productId = productsDocRef.id;

	// * Add bizId to keywords array for search and add default productId
	newBusiness.keywords = [...newBusiness.keywords, bizId];
	newBusiness.productId = productId;

	let stripeId;

	const bIdArr = Object.keys(existingBiz);

	for (let i = 0; i < bIdArr.length; i++) {
		const currId = bIdArr[i];
		const bizInfo = existingBiz[currId];
		stripeId = bizInfo.stripeAccountId;
		break;
	}

	// * New Business
	const addBizInfo = {
		...existingBiz,
		[bizId]: {
			id: bizId,
			name,
			stripeAccountId: stripeId,
		},
	};

	// * Create bizAccount doc for biz
	const userRef = doc(db, "bizAccount", uid);
	batch.update(userRef, {
		bizOwned: addBizInfo,
	});

	// * Set/create biz document
	const bizRef = doc(db, "biz", bizId);
	batch.set(bizRef, newBusiness);

	// * Set/create products collection for biz
	defaultProduct.id = productId;
	batch.set(productsDocRef, defaultProduct, { merge: true });

	// * Commit the batch
	try {
		await batch.commit();
		// TODO: resave new biz to localStorage
		const user = JSON.parse(getLocalStorage("user"));
		user.bizOwned = addBizInfo;
		setLocalStorage("user", user);

		return {
			success: true,
			message: "Business created successfully",
		};
	} catch (error) {
		console.log(error);
		return { success: false, message: "Error batch commit: ", error };
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
	const bizAccRef = doc(db, "bizAccount", uid);

	if (changeLastName) {
		batch.update(bizAccRef, { lastName: updatedBiz.ownerContact.lastName });
	}

	if (changeBizName) {
		batch.update(bizAccRef, { [`bizOwned.${bizId}.name`]: updatedBiz.name });
	}

	if (changeFirstName) {
		batch.update(bizAccRef, {
			firstName: updatedBiz.ownerContact.firstName,
		});
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
	const userRef = doc(db, "bizAccount", uid);

	const batch = writeBatch(db);

	if (name === "form1") {
		const { firstName, lastName, ownerPhoneNumber } = updatedData;
		const firstNameCapFirst = _.capitalize(firstName);
		const lastNameCapFirst = _.capitalize(lastName);

		if (additionalChange) {
			// * Update Users collection firstName, lastName, & inviteCode
			batch.update(userRef, {
				firstName: firstNameCapFirst,
				lastName: lastNameCapFirst,
			});

			for (let i = 0; i < bizId.length; i++) {
				const currBizId = bizId[i];
				const bizDataDocRef = doc(db, "biz", currBizId);

				// * Update bizData
				batch.update(bizDataDocRef, {
					"ownerContact.firstName": firstNameCapFirst,
					"ownerContact.lastName": lastNameCapFirst,
					"ownerContact.phoneNumber": ownerPhoneNumber,
				});
			}

			// * Update localStorage
			storedUser.firstName = firstNameCapFirst;
			storedUser.lastName = lastNameCapFirst;

			setLocalStorage("user", storedUser);
		} else {
			for (let i = 0; i < bizId.length; i++) {
				const currBizId = bizId[i];
				const bizDataDocRef = doc(db, "biz", currBizId);

				batch.update(bizDataDocRef, {
					"ownerContact.lastName": lastNameCapFirst,
					"ownerContact.phoneNumber": ownerPhoneNumber,
				});
			}

			batch.update(userRef, {
				lastName: lastNameCapFirst,
			});

			// * Update localStorage
			storedUser.lastName = lastNameCapFirst;
			setLocalStorage("user", storedUser);
		}
	}

	if (name == "form2") {
		const { loginEmail } = updatedData;

		// * Update loginEmail
		console.log("loginEmail", loginEmail);
		// * Check if email exists
		const bizEmailsDocRef = doc(db, "bizEmailsInUse", loginEmail);
		const emailDocSnap = await getDoc(bizEmailsDocRef);

		if (emailDocSnap.exists()) {
			return { success: false, message: `Email already exists.` };
		}

		const auth = getAuth();
		return updateEmail(auth.currentUser, loginEmail)
			.then(() => {
				const oldBizEmailDocRef = doc(db, "bizEmailsInUse", oldLoginEmail);

				for (let i = 0; i < bizId.length; i++) {
					const currBizId = bizId[i];

					console.log("currBizId");

					const bizDataDocRef = doc(db, "biz", currBizId);

					batch.update(bizDataDocRef, {
						"login.email": loginEmail,
						"storeContact.email": loginEmail,
						"ownerContact.email": loginEmail,
					});
				}

				batch.update(userRef, {
					"login.email": loginEmail,
					"ownerContact.email": loginEmail,
				});

				batch.set(bizEmailsDocRef, { createdAt: new serverTimestamp() });

				batch.delete(oldBizEmailDocRef);
			})
			.then(() => batch.commit())
			.then(() => {
				const ifEmailRemembered = getLocalStorage("rememberedEmail");

				if (ifEmailRemembered && ifEmailRemembered !== "") {
					setLocalStorage("rememberedEmail", loginEmail);
				}

				storedUser.login.email = loginEmail;
				setLocalStorage("user", storedUser);

				return { success: true };
			})
			.catch((e) => {
				console.log(e);
				return { success: false, message: `Could not update login email.` };
			});
	}

	if (name === "form3") {
		const bizDataDocRef = doc(db, "biz", bizId);
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

	if (action === "add") {
		const resBizDocSnap = await getDoc(bizDocRef);
		const data = resBizDocSnap.data();
		const txtNumbers = data.textNumbers;

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

const getBizCollection = async () => {
	const bizCollection = collection(db, "biz");
	const bizSnapshot = await getDocs(bizCollection);
	const bizArr = [];

	bizSnapshot.forEach((doc) => {
		const bizData = doc.data();
		bizData.id = doc.id;

		bizArr.push(bizData);
	});

	return bizArr;
};

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
	const userRef = doc(db, "bizAccount", uid);
	const userRefSnap = await getDoc(userRef);
	if (userRefSnap.exists()) {
		const userData = userRefSnap.data();
		userData.createdAt = "";
		userData.currentLocation = "";
		// userData.hasSignUpReward = "";
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
		docData.id = docSnap.id;
		return { success: true, docData, ordersArr };
	} else {
		return {
			success: false,
			message: `Business user does not exist.`,
		};
	}
}

async function getBizAccount(uid) {
	const bizAccDocRef = doc(db, "bizAccount", uid);
	const bizAccSnap = await getDoc(bizAccDocRef);
	if (bizAccSnap.exists()) {
		const bizAccData = bizAccSnap.data();
		return { success: true, bizAccData };
	} else {
		return { success: false, message: "Could not find business account." };
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

export default createBizAccount;
export {
	getAllBizUserInfo,
	getBizAdminPagination,
	getBiz,
	getBizAccount,
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
	createAdditionalBiz,
	getBizCollection,
};
