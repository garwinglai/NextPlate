import React, { useState } from "react";
import {
	collection,
	addDoc,
	setDoc,
	updateDoc,
	getDocs,
	getDoc,
	doc,
	query,
	orderBy,
	writeBatch,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	deleteField,
	FieldValue,
	limit,
	where,
} from "firebase/firestore";
import {
	db,
	increment,
	decrement,
	incrementArgs,
	decrementArgs,
} from "../../firebase/fireConfig";
import Layout from "../../Components/Layout";
import { fetchStripeAccount } from "../../actions/heroku/stripeAccount";

const blackListRestaurants = [
	// Rabalais santa paula
	"7C2CJXCuRohmhJYVpoGq",
	// Chef david santa paula
	"WKNB1Q0i8UlgTeROMBbi",
	// Enzo italian santa paula
	"uia4uiMuWEiifsnNHz8k",
	// Hozy's grill santa Paula
	"WWoXmkpJ4vVykvutaEyS",
	// Insomnia Cookies
	"bmILh3RBrTj6cpn41fSx",
	// Dulce
	"ZL0JdKSRXHZkrspZXSWq",
];

function Stripe() {
	const [stripeAcc, setStripeAcc] = useState([]);

	const handleFetchStripe = async () => {
		const bizObjData = await getBizStripeAccountIds();
		const stripeAccArr = [];

		for (let i = 0; i < bizObjData.length; i++) {
			const currBiz = bizObjData[i];
			const stripeAccId = currBiz.stripeAccountId;
			const bizName = currBiz.name;
			const bizId = currBiz.id;

			if (blackListRestaurants.includes(bizId)) {
				continue;
			}

			const stripeRes = await fetchStripeAccount(stripeAccId);
			const { success, message } = stripeRes;

			if (success) {
				const detailsSubmitted = stripeRes.detailsSubmitted;
				const errorsArr = stripeRes.requirementErrorsArr;

				const stripeData = { bizName, detailsSubmitted };

				stripeAccArr.push(stripeData);

				console.log("detailsSubmitted", detailsSubmitted);
				console.log("errorsArr", errorsArr);
			} else {
				console.log("error fetching stripe Acc", message);
			}
		}

		setStripeAcc(stripeAccArr);
	};

	const getBizStripeAccountIds = async () => {
		const bizDocRefs = collection(db, "bizAccount");

		try {
			const bizSnapshot = await getDocs(bizDocRefs);
			let bizObjData = [];

			bizSnapshot.forEach((doc) => {
				const data = doc.data();
				const bizOwned = data.bizOwned;

				for (const key in bizOwned) {
					const bizId = key;
					const bizObj = bizOwned[bizId];

					bizObjData.push(bizObj);
				}
			});

			return bizObjData;
		} catch (error) {
			console.log("get stripe account id error", error);
		}
	};

	return (
		<Layout currentPage="admin">
			<button onClick={handleFetchStripe}>Fetch stripe accounts</button>
			{stripeAcc.map((biz) => {
				return (
					<div>
						<p>Biz name: {biz.bizName}</p>
						<p>Details submitted: {JSON.stringify(biz.detailsSubmitted)}</p>
					</div>
				);
			})}
		</Layout>
	);
}

export default Stripe;
