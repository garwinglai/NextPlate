import React from "react";
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
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import Layout from "../../Components/Layout";
import { async } from "@firebase/util";

function Payouts() {
	const handlePayoutClick = async () => {
		await payoutAllBiz();
	};

	const payoutAllBiz = async () => {
		const bizAccountArray = await getAllBizAccounts();
		console.log(bizAccountArray, "bizAccountArr");

		for (let i = 0; i < bizAccountArray.length; i++) {
			const currObj = bizAccountArray[i];
			const {
				id: bizId,
				name,
				stripeAccountId: stripeId,
				clientName,
			} = currObj;

			const { bizFeesDble, lastPayoutDate, bizAddress } =
				await getBizFeesAndDates(bizId);
			console.log(lastPayoutDate, "lastDate");
			const { numOrders, totalSales } = await getTotalRevenueAndNumOrders(
				bizId,
				lastPayoutDate
			);
			const profit = calculateProfits(bizFeesDble, numOrders, totalSales);
			const { success, message } = await payout(profit, stripeId);

			const totalBizFees = bizFeesDble * numOrders;

			if (success) {
				await savePayout(
					bizId,
					lastPayoutDate,
					bizFeesDble,
					profit,
					totalSales,
					totalBizFees,
					name,
					clientName,
					bizAddress
				);
			} else {
				console.log(message);
			}
		}
	};

	const getAllBizAccounts = async () => {
		const bizAccountDocRef = collection(db, "bizAccount");
		try {
			const bizAccountSnapshot = await getDocs(bizAccountDocRef);
			const bizArr = [];

			bizAccountSnapshot.forEach((doc) => {
				const data = doc.data();
				const bizOwned = data.bizOwned;
				const fName = data.firstName;
				const lName = data.lastName;
				const clientName = fName + " " + lName;

				for (const key in bizOwned) {
					const obj = bizOwned[key];
					obj.clientName = clientName;

					bizArr.push(obj);
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
			let bizAddress;

			if (!lastPayout) {
				console.log("null");
				const bizDocRef = doc(db, "biz", bizId);
				// * If no payouts yet, use createdAt biz as a standard for payout dates
				const bizSnapshot = await getDoc(bizDocRef);
				const bizData = bizSnapshot.data();
				const address = bizSnapshot.address;
				const { bizFees, createdAt } = bizData;
				const { feesAsDouble } = bizFees;
				const { seconds, nanoseconds } = createdAt;
				const createdAtEpoch = (seconds + nanoseconds * 0.000000001) * 1000;

				bizAddress = address;
				lastPayoutDate = createdAtEpoch;
				bizFeesDble = feesAsDouble;
			} else {
				// * If has payouts before, use the last payout time
				const { endDateEpoch, bizFeesDouble, address } = lastPayout;

				bizAddress = address;
				lastPayoutDate = endDateEpoch;
				bizFeesDble = bizFeesDouble;
			}

			return { bizFeesDble, lastPayoutDate, bizAddress };
		} catch (error) {
			console.log(error);
			// Todo: handle error
		}
	};

	const getPayouts = async (bizId) => {
		const payoutsDocRef = collection(db, "biz", bizId, "payouts");
		const q = query(payoutsDocRef, orderBy("createdAt", "desc"), limit(1));

		const payoutsSnapshot = await getDocs(q);

		if (payoutsSnapshot.size > 0) {
			const payoutData = payoutsSnapshot.data();
			return payoutData;
		} else {
			console.log("payouts does not exists");
			return null;
		}
	};

	const getTotalRevenueAndNumOrders = async (bizId, lastPayoutDate) => {
		console.log(lastPayoutDate, "lastPayoutDate");
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const q = query(ordersDocRef, where("endTime", ">", lastPayoutDate));
		try {
			const ordersSnapshot = await getDocs(q);
			let salesPerOrderArr = [];
			let numOrders = 0;
			let totalSales = 0;

			ordersSnapshot.forEach((doc) => {
				const ordersData = doc.data();
				const totalPerOrder = ordersData.bizTotalPriceDouble;

				salesPerOrderArr.push(totalPerOrder);
			});

			const salesArrLength = salesPerOrderArr.length;

			if (salesArrLength > 0) {
				numOrders = salesArrLength;
				totalSales = salesPerOrderArr.reduce((sum, val) => (sum += val));
			}
			console.log(salesPerOrderArr);
			return { numOrders, totalSales };
		} catch (error) {
			console.log("error", error);
			// TODO: handle error
		}
	};

	const calculateProfits = (bizFeesDble, numOrders, totalSales) => {
		const profit = totalSales - numOrders * bizFeesDble;
		const roundedProfit = bankersRound(profit);
		console.log("roundedProfit", roundedProfit);

		return roundedProfit;
	};

	const isEven = (roundedProfit) => {
		return 0 === roundedProfit % 2;
	};

	const bankersRound = (profit) => {
		const roundedProfit = Math.round(profit);
		return (profit > 0 ? profit : -profit) % 1 === 0.5
			? isEven(roundedProfit)
				? roundedProfit
				: roundedProfit - 1
			: roundedProfit;
	};

	const payout = async () => {
		// TODO: Heroku
		return { success: true };
	};

	const savePayout = async (
		bizId,
		lastPayoutDate,
		bizFeesDble,
		profit,
		totalSales,
		totalBizFees,
		name,
		clientName,
		bizAddress
	) => {
		const date = new Date();
		const endDateEpoch = Date.parse(date);
		const startDateEpoch = lastPayoutDate;
		const createdAt = new serverTimestamp();
		const totalSalesStr = `$${totalSales.toString()}`;
		const totalSalesDouble = totalSales;
		const bizFeesStr = `$${bizFeesDble.toString()}`;
		const bizFeesDouble = bizFeesDble;
		const totalBizFeesStr = `$${totalBizFees.toString()}`;
		const totalBizFeesDouble = totalBizFees;
		const payoutAmtStr = `$${profit.toString()}`;
		const payoutAmtDouble = profit;
		const paymentDateEpoch = Date.parse(date);
		const paidTo = name;
		const address = bizAddress;

		const payoutData = {
			createdAt,
			startDateEpoch,
			endDateEpoch,
			totalSalesStr,
			totalSalesDouble,
			bizFeesStr,
			bizFeesDouble,
			totalBizFeesStr,
			totalBizFeesDouble,
			payoutAmtStr,
			payoutAmtDouble,
			paymentDateEpoch,
			paidTo,
			clientName,
			address,
		};

		console.log(payoutData);

		const bizPayoutDocRef = doc(collection(db, "biz", bizId, "payouts"));
		return;
		// await setDoc(bizPayoutDocRef, payoutData);
	};

	return (
		<Layout currentPage="admin">
			<button onClick={handlePayoutClick}>Payout Business</button>
		</Layout>
	);
}

export default Payouts;
