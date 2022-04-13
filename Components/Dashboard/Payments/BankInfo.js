import React, { useState, useEffect } from "react";
import styles from "../../../styles/components/dashboard/payments/bankinfo.module.css";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { Button, Grid } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { connectStripeAccount } from "../../../actions/heroku/stripeAccount";
import { useRouter } from "next/router";
import {
	collection,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	limit,
	orderBy,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";

function BankInfo({ stripeAccId, detailsSubmitted, errMsg, uid, bizId }) {
	const [profit, setProfit] = useState("0");
	const [isSuccessAlertOpen, setIsSuccessAlertOpen] =
		useState(detailsSubmitted);
	const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(
		errMsg ? true : false
	);
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const [responseHandle, setResponseHandle] = useState({
		loading: false,
		successMessage: detailsSubmitted ? "Bank account connected." : "",
		errorMessage: errMsg,
	});

	const { loading, successMessage, errorMessage } = responseHandle;

	const router = useRouter();

	useEffect(() => {
		getProfits(bizId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getProfits = async (bizId) => {
		const { bizFeesDouble, lastPayoutDate } = await getBizFeesAndDates(bizId);
		const { numOrders, totalSales } = await getTotalRevenueAndNumOrders(
			bizId,
			lastPayoutDate
		);
		const calculatedProfit = (totalSales - numOrders * bizFeesDouble).toFixed(
			2
		);

		const calcProfitString = `$${calculatedProfit.toString()}`;
		console.log(bizFeesDouble, numOrders, totalSales);

		setProfit(calcProfitString);
	};

	const getBizFeesAndDates = async (bizId) => {
		const bizDocRef = doc(db, "biz", bizId);
		try {
			const lastPayout = await getPayouts(bizId);

			let lastPayoutDate;
			let bizFeesDouble;

			if (!lastPayout) {
				// * If no payouts yet, use createdAt biz as a standard for payout dates
				const bizSnapshot = await getDoc(bizDocRef);
				const bizData = bizSnapshot.data();
				const { bizFees, createdAt } = bizData;
				const { feesAsDouble } = bizFees;
				const { seconds, nanoseconds } = createdAt;
				const createdAtEpoch = (seconds + nanoseconds * 0.000000001) * 1000;

				lastPayoutDate = createdAtEpoch;
				bizFeesDouble = feesAsDouble;
			} else {
				// * If has payouts before, use the last payout time
				const { endDateEpoch, bizFeesDouble } = lastPayout;

				lastPayoutDate = endDateEpoch;
				bizFeesDouble = bizFeesDouble;
			}

			return { bizFeesDouble, lastPayoutDate };
		} catch (error) {
			console.log("bizFees error", error);
			// TODO: handle error
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
		console.log(lastPayoutDate);
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

	// * ACTIONS -----------------------------------------------------------------

	const handleConnectStripe = async (e, stripeAccId) => {
		setResponseHandle((prev) => ({ ...prev, loading: true }));
		const refreshUrl = `https://next-plate.web.app/dashboard/${uid}/payments`;
		const returnUrl = `https://next-plate.web.app/dashboard/${uid}/payments`;

		let resConnectStripe = await connectStripeAccount(
			stripeAccId,
			refreshUrl,
			returnUrl
		);
		if (resConnectStripe.success) {
			const stripeUrl = resConnectStripe.url;
			router.push(stripeUrl);
		} else {
			setResponseHandle((prev) => ({
				...prev,
				loading: false,
				successMessage: "",
				errorMessage: resConnectStripe.message,
			}));
		}
	};

	async function handleClickPayout() {
		// TODO: handle cash out
		window.alert("payout");
	}

	return (
		<div className={`${styles.BankInfo} ${styles.flexCol}`}>
			<div className={`${styles.BankInfo__header} ${styles.flexRow}`}>
				<div className={`${styles.BankInfo__BoxHeader} ${styles.Box} `}>
					<h5>Payout Balance</h5>
					<h1>{profit}</h1>
				</div>

				{successMessage && (
					<Grid item xs={12} md={12} mt={2}>
						<Collapse in={isSuccessAlertOpen}>
							<Alert
								severity="success"
								className={styles.Alert}
								onClose={() => {
									setIsSuccessAlertOpen(false);
								}}
							>
								<AlertTitle className={styles.AlertTitle}>Success</AlertTitle>
								{successMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}
				{errorMessage && (
					<Grid item xs={12} md={12} mt={2}>
						<Collapse in={isErrorAlertOpen}>
							<Alert
								severity="error"
								className={styles.Alert}
								onClose={() => {
									setIsErrorAlertOpen(false);
								}}
							>
								<AlertTitle className={styles.AlertTitle}>Error</AlertTitle>
								{errorMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}
				{!detailsSubmitted && (
					<Grid item xs={12} md={12} mt={2}>
						<Collapse in={isAlertOpen}>
							<Alert severity="info" className={styles.Alert}>
								<AlertTitle className={styles.AlertTitle}>
									Information
								</AlertTitle>
								No bank information. Add bank information in order to receive
								payouts.
							</Alert>
						</Collapse>
					</Grid>
				)}
			</div>
			{loading ? (
				<CircularProgress />
			) : (
				<div className={styles.paymentButton}>
					<Button
						variant="contained"
						size="large"
						fullWidth
						onClick={
							!detailsSubmitted
								? (e) => handleConnectStripe(e, stripeAccId)
								: handleClickPayout
						}
					>
						{!detailsSubmitted ? "+ Connect Bank" : "Payout"}
					</Button>
				</div>
			)}
		</div>
	);
}

export default BankInfo;
