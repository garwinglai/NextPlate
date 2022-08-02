import React, { useState } from "react";
import {
	collection,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	limit,
	orderBy,
	serverTimestamp,
	setDoc,
	writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import Layout from "../../Components/Layout";
import BizPayoutCard from "../../Components/Admin/BizPayoutCard";
import { payoutStripe } from "../../actions/heroku/stripeAccount";

function Payouts() {
	const [bizPayouts, setBizPayouts] = useState([]);
	const [showCalculateBtn, setShowCalculateBtn] = useState(true);
	const [showPayoutBtn, setShowPayoutBtn] = useState(false);
	const [isCalculating, setIsCalculating] = useState(false);
	const [paidAll, setPaidAll] = useState(false);

	const handleShowPayoutClick = async () => {
		setIsCalculating(true);
		setShowCalculateBtn(false);
		await showBizPayouts();
	};

	const showBizPayouts = async () => {
		const bizAccountArray = await getAllBizAccounts();
		const date = new Date();
		date.setDate(date.getDate() - 1);
		const currPayoutEndDate = date.setHours(23, 59, 59, 999);

		for (let i = 0; i < bizAccountArray.length; i++) {
			const currObj = bizAccountArray[i];
			const {
				id: bizId,
				name,
				stripeAccountId: stripeId,
				clientName,
			} = currObj;

			const {
				bizFeesDble,
				lastPayoutDate,
				bizAddress,
				customerFeesDble,
				isBizFeesPercent,
			} = await getBizFeesAndDates(bizId);
			const { numOrders, totalSales, totalStripeFees, totalSubTotal } =
				await getTotalRevenueAndNumOrders(
					bizId,
					lastPayoutDate,
					currPayoutEndDate
				);
			const totalCanceledStripeFees = await getTotalCanceledFees(
				bizId,
				lastPayoutDate,
				currPayoutEndDate
			);
			const profit = calculateProfits(
				isBizFeesPercent,
				totalSubTotal,
				bizFeesDble,
				numOrders,
				totalSales,
				totalCanceledStripeFees
			);
			let totalBizFeesUnRounded;

			if (isBizFeesPercent) {
				totalBizFeesUnRounded = (totalSubTotal * bizFeesDble) / 100;
			} else {
				totalBizFeesUnRounded = bizFeesDble * numOrders;
			}
			const totalBizFees = stripeRound(totalBizFeesUnRounded);
			const roundedStripeFees = stripeRound(totalStripeFees);
			totalSubTotal = stripeRound(totalSubTotal);
			totalSales = stripeRound(totalSales);
			totalCanceledStripeFees = stripeRound(totalCanceledStripeFees);

			showPayouts(
				bizId,
				lastPayoutDate,
				currPayoutEndDate,
				bizFeesDble,
				totalSubTotal,
				profit,
				totalSales,
				totalBizFees,
				name,
				clientName,
				bizAddress,
				stripeId,
				numOrders,
				roundedStripeFees,
				totalCanceledStripeFees,
				customerFeesDble,
				isBizFeesPercent
			);
		}
		setIsCalculating(false);
		setShowPayoutBtn((prev) => !prev);
	};

	const getAllBizAccounts = async () => {
		const bizAccountDocRef = collection(db, "bizAccount");
		try {
			const bizAccountSnapshot = await getDocs(bizAccountDocRef);
			const bizArr = [];

			// * Admin test restaurants, remove from list of paid restaurants
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

			// ! Rabalais for payment (testing)
			const testRestaurants = [
				"7C2CJXCuRohmhJYVpoGq",
				"WKNB1Q0i8UlgTeROMBbi",
				// "WWoXmkpJ4vVykvutaEyS",
			];

			bizAccountSnapshot.forEach((doc) => {
				const data = doc.data();
				const bizOwned = data.bizOwned;
				const fName = data.firstName;
				const lName = data.lastName;
				const clientName = fName + " " + lName;

				for (const key in bizOwned) {
					const obj = bizOwned[key];
					obj.clientName = clientName;

					// * Live restaurants
					if (!blackListRestaurants.includes(obj.id)) {
						bizArr.push(obj);
					}

					// ! Test restaurant (testing)
					// if (testRestaurants.includes(obj.id)) {
					// 	bizArr.push(obj);
					// }
				}
			});
			return bizArr;
		} catch (error) {
			console.log("getBizAccount", error);
			// TODO: Handle error
		}
	};

	const getBizFeesAndDates = async (bizId) => {
		try {
			const lastPayout = await getPayouts(bizId);

			let lastPayoutDate;
			let bizFeesDble;
			let isBizFeesPercent = false;
			let bizAddress;
			let customerFeesDble;

			if (!lastPayout) {
				const bizDocRef = doc(db, "biz", bizId);
				// * If no payouts yet, use createdAt biz as a standard for payout dates
				const bizSnapshot = await getDoc(bizDocRef);

				if (bizSnapshot.exists()) {
					const bizData = bizSnapshot.data();
					const address = bizData.address;
					const { bizFees, createdAt, customerFees } = bizData;
					const { feesAsDouble, pctFeesAsDouble } = bizFees;
					const { seconds, nanoseconds } = createdAt;
					const createdAtEpoch = (seconds + nanoseconds * 0.000000001) * 1000;

					bizAddress = address;
					lastPayoutDate = createdAtEpoch;
					if (pctFeesAsDouble) {
						bizFeesDble = pctFeesAsDouble;
						isBizFeesPercent = true;
					} else {
						bizFeesDble = feesAsDouble;
					}

					customerFeesDble = customerFees.feesAsDouble;
				} else {
					// TODO: Handle Error for business does not exist
				}
			} else {
				// * If has payouts before, use the last payout time
				const {
					endDateEpoch,
					bizFeesDouble,
					isBizFeesPct,
					address,
					customerFeesDouble,
				} = lastPayout;

				bizAddress = address;
				lastPayoutDate = endDateEpoch;
				bizFeesDble = bizFeesDouble;
				customerFeesDble = customerFeesDouble;
				isBizFeesPercent = isBizFeesPct;
			}

			return {
				bizFeesDble,
				lastPayoutDate,
				bizAddress,
				customerFeesDble,
				isBizFeesPercent,
			};
		} catch (error) {
			console.log("admin get biz fees error", error);
			// Todo: handle error
		}
	};

	const getPayouts = async (bizId) => {
		const payoutsDocRef = collection(db, "biz", bizId, "payouts");
		const q = query(payoutsDocRef, orderBy("createdAt", "desc"), limit(1));

		const payoutsSnapshot = await getDocs(q);

		if (payoutsSnapshot.size > 0) {
			let payoutData;

			payoutsSnapshot.forEach((doc) => {
				payoutData = doc.data();
			});

			return payoutData;
		} else {
			// * No payouts made yet, return null in order to grab biz started date to use as start period for payout.
			return null;
		}
	};

	const getTotalRevenueAndNumOrders = async (
		bizId,
		lastPayoutDate,
		currPayoutEndDate
	) => {
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const q = query(
			ordersDocRef,
			where("endTime", ">", lastPayoutDate),
			where("endTime", "<=", currPayoutEndDate),
			where("status", "==", "Completed")
		);
		try {
			let salesPerOrderArr = [];
			let subTotalAmtArr = [];
			let stripeFeesArr = [];
			let bizTaxArr = [];
			let numOrders = 0;
			let totalSales = 0;
			let totalStripeFees = 0;
			let totalSubTotal = 0;
			let totalBizTax = 0;

			const ordersSnapshot = await getDocs(q);
			ordersSnapshot.forEach((doc) => {
				const ordersData = doc.data();
				const totalPerOrder = ordersData.bizTotalPriceDouble;
				const bizSubTotal = ordersData.subtotalAmt;
				const bizTaxAmt = ordersData.bizTaxAmt;
				const stripeFee = totalPerOrder * 0.029 + 0.3;

				salesPerOrderArr.push(totalPerOrder);
				subTotalAmtArr.push(bizSubTotal);
				stripeFeesArr.push(stripeFee);
				bizTaxArr.push(bizTaxAmt);
			});

			const salesArrLength = salesPerOrderArr.length;

			if (salesArrLength > 0) {
				numOrders = salesArrLength;
				totalSales = salesPerOrderArr.reduce((sum, val) => (sum += val));
				totalStripeFees = stripeFeesArr.reduce((sum, val) => (sum += val));
				totalSubTotal = subTotalAmtArr.reduce((sum, val) => (sum += val));
				totalBizTax = bizTaxArr.reduce((sum, val) => (sum += val));
			}

			return {
				numOrders,
				totalSales,
				totalStripeFees,
				totalSubTotal,
				totalBizTax,
			};
		} catch (error) {
			console.log("error admin getTotalRev&NumOrders", error);
			// TODO: handle error
		}
	};

	const getTotalCanceledFees = async (
		bizId,
		lastPayoutDate,
		currPayoutEndDate
	) => {
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const q = query(
			ordersDocRef,
			where("endTime", ">", lastPayoutDate),
			where("endTime", "<=", currPayoutEndDate),
			where("status", "==", "Canceled")
		);

		try {
			const ordersSnapshot = await getDocs(q);

			const stripeFeesArr = [];
			let totalCanceledStripeFees = 0;

			ordersSnapshot.forEach((doc) => {
				const data = doc.data();
				const totalPerOrder = data.bizTotalPriceDouble;
				const stripeFee = totalPerOrder * 0.029 + 0.3;

				stripeFeesArr.push(stripeFee);
			});

			const stripeFeesArrLength = stripeFeesArr.length;

			if (stripeFeesArrLength > 0) {
				totalCanceledStripeFees = stripeFeesArr.reduce(
					(sum, val) => (sum += val)
				);
			}

			return totalCanceledStripeFees;
		} catch (error) {
			console.log("get cancelled fees error", error);
		}
	};

	const calculateProfits = (
		isBizFeesPercent,
		totalSubTotal,
		bizFeesDble,
		numOrders,
		totalSales,
		totalCanceledStripeFees
	) => {
		let profit;

		if (isBizFeesPercent) {
			const nextPlateFees = totalSubTotal * (bizFeesDble / 100);
			profit = totalSales - nextPlateFees - totalCanceledStripeFees;
		} else {
			const nextPlateFees = bizFeesDble * numOrders;
			profit = totalSales - nextPlateFees - totalCanceledStripeFees;
		}
		const roundedProfit = stripeRound(profit);

		return roundedProfit;
	};

	function stripeRound(num) {
		return +(Math.round(num + "e+2") + "e-2");
	}

	function bankersRound(profit, decimalPlaces) {
		var decimalPlace = decimalPlaces || 0;
		var power = Math.pow(10, decimalPlace);
		var n = +(decimalPlace ? profit * power : profit).toFixed(8); // Avoid rounding errors
		var i = Math.floor(n),
			f = n - i;
		var e = 1e-8; // Allow for rounding errors in f
		var r =
			f > 0.5 - e && f < 0.5 + e ? (i % 2 == 0 ? i : i + 1) : Math.round(n);
		return decimalPlace ? r / power : r;
	}

	const showPayouts = async (
		bizId,
		lastPayoutDate,
		currPayoutEndDate,
		bizFeesDble,
		totalSubTotal,
		profit,
		totalSales,
		totalBizFees,
		name,
		clientName,
		bizAddress,
		stripeId,
		numOrders,
		roundedStripeFees,
		totalCanceledStripeFees,
		customerFeesDble,
		isBizFeesPercent
	) => {
		const date = new Date();
		const endDateEpoch = currPayoutEndDate;
		const endDateShort = new Date(currPayoutEndDate).toLocaleDateString();
		const startDateEpoch = lastPayoutDate;
		const startDateShort = new Date(lastPayoutDate).toLocaleDateString();
		const createdAt = new serverTimestamp();
		const totalSubTotalStr = `$${totalSubTotal.toString()}`;
		const totalSubTotalDouble = totalSubTotal;
		const totalSalesStr = `$${totalSales.toString()}`;
		const totalSalesDouble = totalSales;
		const bizFeesStr = isBizFeesPercent
			? `${bizFeesDble.toString()}%`
			: `$${bizFeesDble.toString()}`;
		const bizFeesDouble = bizFeesDble;
		const isBizFeesPct = isBizFeesPercent;
		const totalBizFeesStr = `$${totalBizFees.toString()}`;
		const totalBizFeesDouble = totalBizFees;
		const payoutAmtStr = `$${profit.toString()}`;
		const payoutAmtDouble = profit;
		const paymentDateEpoch = Date.parse(date);
		const paymentDateShort = date.toLocaleDateString();
		const paidToName = name;
		const address = bizAddress;
		const totalStripeFeesDouble = roundedStripeFees;
		const totalStripeFeesStr = `$${roundedStripeFees.toString()}`;
		let nextPlateRevenueDouble =
			numOrders * customerFeesDble + totalBizFeesDouble;
		nextPlateRevenueDouble = stripeRound(nextPlateRevenueDouble);
		const nextPlateRevenueStr = `$${nextPlateRevenueDouble.toString()}`;
		const totalCanceledStripeFeesDouble = totalCanceledStripeFees;
		const totalCanceledStripeFeesStr = `$${totalCanceledStripeFees.toString()}`;
		const customerFeesString = `$${customerFeesDble.toString()}`;
		const customerFeesDouble = customerFeesDble;
		let nextPlateProfitDouble = nextPlateRevenueDouble - totalStripeFeesDouble;
		nextPlateProfitDouble = stripeRound(nextPlateProfitDouble);
		const nextPlateProfitString = `$${nextPlateProfitDouble.toString()}`;

		const payoutData = {
			bizId,
			createdAt,
			startDateEpoch,
			endDateEpoch,
			startDateShort,
			endDateShort,
			totalSubTotalStr,
			totalSubTotalDouble,
			totalSalesStr,
			totalSalesDouble,
			isBizFeesPct,
			bizFeesStr,
			bizFeesDouble,
			totalBizFeesStr,
			totalBizFeesDouble,
			payoutAmtStr,
			payoutAmtDouble,
			paymentDateEpoch,
			paymentDateShort,
			paidToName,
			clientName,
			address,
			stripeId,
			numOrders,
			totalSalesDouble,
			totalStripeFeesStr,
			totalStripeFeesDouble,
			nextPlateRevenueDouble,
			nextPlateRevenueStr,
			totalCanceledStripeFeesDouble,
			totalCanceledStripeFeesStr,
			customerFeesDouble,
			customerFeesString,
			nextPlateProfitDouble,
			nextPlateProfitString,
		};

		setBizPayouts((prev) => [...prev, payoutData]);
	};

	const handleReset = () => {
		setBizPayouts([]);
		setShowPayoutBtn(false);
		setIsCalculating(false);
		setPaidAll(false);
		setShowCalculateBtn(true);
	};

	const handlePayoutAll = async () => {
		const bizPayoutsLength = bizPayouts.length;

		const batch = writeBatch(db);

		for (let i = 0; i < bizPayoutsLength; i++) {
			const currBizPayoutData = bizPayouts[i];
			const stripeId = currBizPayoutData.stripeId;
			const name = currBizPayoutData.paidToName;
			const bizId = currBizPayoutData.bizId;
			const profit = currBizPayoutData.payoutAmtDouble;

			const { success, message } = await payoutHeroku(profit, stripeId);

			console.log({ name, stripeId, success, message });

			if (success) {
				// * Save successful payouts to biz
				const bizPayoutId = await savePayoutBiz(
					currBizPayoutData,
					bizId,
					batch,
					success,
					message
				);

				await savePayoutAdmin(
					currBizPayoutData,
					batch,
					success,
					message,
					bizPayoutId
				);
			} else {
				console.log(`Error paying out biz: ${name}. BizId: ${bizId}`, message);
				// * Save unsuccessful payouts to biz
				const bizPayoutId = await savePayoutBiz(
					currBizPayoutData,
					bizId,
					batch,
					success,
					message
				);
				await savePayoutAdmin(
					currBizPayoutData,
					batch,
					success,
					message,
					bizPayoutId
				);
			}
		}

		try {
			await batch.commit();
			setPaidAll(true);
			setShowPayoutBtn(false);
		} catch (error) {
			console.log("error commiting payment batch", error);
			return;
		}
	};

	const payoutHeroku = async (profit, stripeId) => {
		const amount = profit * 100;
		const account = stripeId;

		const { success, message } = await payoutStripe(amount, account);

		return { success, message };
	};

	const savePayoutBiz = async (
		currBizPayoutData,
		bizId,
		batch,
		success,
		message
	) => {
		const bizPayoutDocRef = doc(collection(db, "biz", bizId, "payouts"));
		const bizPayoutId = bizPayoutDocRef.id;
		currBizPayoutData.id = bizPayoutId;
		const failedBizPayoutsDocRef = doc(db, "failedPayouts", bizPayoutId);

		if (success) {
			currBizPayoutData.status = "Paid";

			batch.set(bizPayoutDocRef, currBizPayoutData, { merge: true });
		} else {
			currBizPayoutData.status = "Unpaid";
			currBizPayoutData.errorMessage = message;

			// * Update failedPayouts collection
			batch.set(failedBizPayoutsDocRef, currBizPayoutData, { merge: true });
		}

		return bizPayoutId;
	};

	const savePayoutAdmin = async (
		currBizPayoutData,
		batch,
		success,
		message,
		bizPayoutId
	) => {
		const adminUid = "6IUWvD23ayVkRlxaO2wtSM2faNB3";
		const adminPayoutDocRef = doc(
			db,
			"admin",
			adminUid,
			"payouts",
			bizPayoutId
		);
		const adminFailedPayoutsDocRef = doc(
			db,
			"admin",
			adminUid,
			"failedPayouts",
			bizPayoutId
		);
		currBizPayoutData.id = bizPayoutId;

		if (success) {
			currBizPayoutData.status = "Paid";

			batch.set(adminPayoutDocRef, currBizPayoutData, { merge: true });
		} else {
			currBizPayoutData.status = "Unpaid";
			currBizPayoutData.errorMessage = message;

			batch.set(
				adminFailedPayoutsDocRef,
				{ currBizPayoutData },
				{ merge: true }
			);
		}
	};

	return (
		<Layout currentPage="admin">
			<div style={{ display: "flex", gap: "100px" }}>
				<button onClick={handleShowPayoutClick} disabled={!showCalculateBtn}>
					Calculate Business Payouts
				</button>
				<button onClick={handlePayoutAll} disabled={!showPayoutBtn}>
					Payout All
				</button>
				<button onClick={handleReset}>Reset</button>
			</div>
			{isCalculating && <p>Calculating...</p>}
			{paidAll && <p>All Paid.</p>}

			{bizPayouts.map((payout) => {
				return <BizPayoutCard key={payout.bizId} payout={payout} />;
			})}
		</Layout>
	);
}

export default Payouts;
