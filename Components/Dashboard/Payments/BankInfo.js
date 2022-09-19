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

function BankInfo({ stripeAccId, detailsSubmitted, errMsg, uid, bizIdArr }) {
	const [profit, setProfit] = useState("0");
	const [isSuccessAlertOpen, setIsSuccessAlertOpen] =
		useState(detailsSubmitted);
	const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(
		errMsg ? true : false
	);
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const [responseHandle, setResponseHandle] = useState({
		loading: false,
		successMessage: detailsSubmitted ? "Payouts every Monday." : "",
		errorMessage: errMsg,
	});

	const { loading, successMessage, errorMessage } = responseHandle;

	const router = useRouter();

	useEffect(() => {
		getProfits(bizIdArr);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getProfits = async (bizIdArr) => {
		let calculatedProfit = 0;

		for (let i = 0; i < bizIdArr.length; i++) {
			const bizId = bizIdArr[i];

			const {
				bizFeesDble,
				lastPayoutDate,
				bizAddress,
				customerFeesDble,
				isBizFeesPercent,
			} = await getBizFeesAndDates(uid, bizId);
			const {
				numOrders,
				totalSales,
				totalStripeFees,
				totalSubTotal,
				totalNoCommissionSales,
				totalNoCommissionSubTotal,
			} = await getTotalRevenueAndNumOrders(bizId, lastPayoutDate);
			const totalCanceledStripeFees = await getTotalCanceledFees(
				bizId,
				lastPayoutDate
			);
			const profit = calculateProfits(
				isBizFeesPercent,
				totalSubTotal,
				bizFeesDble,
				numOrders,
				totalSales,
				totalCanceledStripeFees,
				totalNoCommissionSales,
				totalNoCommissionSubTotal
			);
			const profitNum = parseFloat(profit);

			calculatedProfit += profitNum;
		}

		const calcProfitString = `$${calculatedProfit.toString()}`;
		setProfit(calcProfitString);
	};

	const getBizFeesAndDates = async (uid, bizId) => {
		try {
			const lastPayout = await getPayouts(uid);

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
			console.log("bizFees error", error);
			// TODO: handle error
		}
	};

	const getPayouts = async (bizId) => {
		const payoutsDocRef = collection(db, "bizAccount", bizId, "payouts");
		const q = query(payoutsDocRef, orderBy("createdAt", "desc"), limit(1));

		const payoutsSnapshot = await getDocs(q);

		if (payoutsSnapshot.size > 0) {
			let payoutData;

			payoutsSnapshot.forEach((doc) => {
				const data = doc.data();
				payoutData = data;
			});

			return payoutData;
		} else {
			// * New business, so no payouts. Return Null so that we can grab biz start date as initial date of payment.
			return null;
		}
	};

	const getTotalRevenueAndNumOrders = async (bizId, lastPayoutDate) => {
		const septFirst = new Date("September 1, 2022 00:00:00");
		const septFirstEpoch = Date.parse(septFirst);

		const noCommissionAugustBiz = [
			// Funculo
			"L27Fa9DmUzXmpLJr5BFz",
			// Knead noods Pasata
			"mMVqwtl3jmPm3vU2SuMG",
			// Civilization
			"PkSfV8QqS3frbO4kK5aZ",
		];

		const lastDatePaid = new Date(lastPayoutDate);
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const q = query(
			ordersDocRef,
			where("createdAt", ">", lastDatePaid),
			where("status", "==", "Completed")
		);

		try {
			let noCommissionAugSalesArr = [];
			let noCommissionAugSubTotalArr = [];
			let salesPerOrderArr = [];
			let subTotalAmtArr = [];
			let stripeFeesArr = [];
			let bizTaxArr = [];
			let totalNoCommissionSales = 0;
			let totalNoCommissionSubTotal = 0;
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
				const orderEndTime = ordersData.endTime;

				if (
					noCommissionAugustBiz.includes(bizId) &&
					orderEndTime < septFirstEpoch
				) {
					noCommissionAugSalesArr.push(totalPerOrder);
					noCommissionAugSubTotalArr.push(bizSubTotal);
					stripeFeesArr.push(stripeFee);
					bizTaxArr.push(bizTaxAmt);
				} else {
					salesPerOrderArr.push(totalPerOrder);
					subTotalAmtArr.push(bizSubTotal);
					stripeFeesArr.push(stripeFee);
					bizTaxArr.push(bizTaxAmt);
				}
			});

			const salesArrLength = salesPerOrderArr.length;
			const noCommissionSalesArrLength = noCommissionAugSalesArr.length;

			if (salesArrLength > 0 || noCommissionSalesArrLength > 0) {
				numOrders = salesArrLength + noCommissionSalesArrLength;

				if (noCommissionSalesArrLength > 0) {
					totalNoCommissionSubTotal = noCommissionAugSubTotalArr.reduce(
						(sum, val) => (sum += val)
					);
					totalNoCommissionSales = noCommissionAugSalesArr.reduce(
						(sum, val) => (sum += val)
					);
				}

				if (salesArrLength > 0) {
					totalSales = salesPerOrderArr.reduce((sum, val) => (sum += val));
					totalSubTotal = subTotalAmtArr.reduce((sum, val) => (sum += val));
				}

				totalStripeFees = stripeFeesArr.reduce((sum, val) => (sum += val));
				totalBizTax = bizTaxArr.reduce((sum, val) => (sum += val));
			}

			return {
				numOrders,
				totalSales,
				totalStripeFees,
				totalSubTotal,
				totalBizTax,
				totalNoCommissionSales,
				totalNoCommissionSubTotal,
			};
		} catch (error) {
			console.log("error", error);
			// TODO: handle error
		}
	};

	const getTotalCanceledFees = async (bizId, lastPayoutDate) => {
		const ordersDocRef = collection(db, "biz", bizId, "orders");
		const q = query(
			ordersDocRef,
			where("endTime", ">", lastPayoutDate),
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
		totalCanceledStripeFees,
		totalNoCommissionSales,
		totalNoCommissionSubTotal
	) => {
		let profit;

		if (isBizFeesPercent) {
			const nextPlateFees = totalSubTotal * (bizFeesDble / 100);
			profit =
				totalNoCommissionSales +
				totalSales -
				nextPlateFees -
				totalCanceledStripeFees;
		} else {
			const nextPlateFees = bizFeesDble * numOrders;
			profit =
				totalNoCommissionSales +
				totalSales -
				nextPlateFees -
				totalCanceledStripeFees;
		}
		const roundedProfit = stripeRound(profit);

		return roundedProfit;
	};

	function stripeRound(num) {
		return +(Math.round(num + "e+2") + "e-2");
	}

	// * ACTIONS -----------------------------------------------------------------

	const handleConnectStripe = async (e, stripeAccId) => {
		setResponseHandle((prev) => ({ ...prev, loading: true }));
		const refreshUrl = `https://nextplate.app/dashboard/${uid}/payments`;
		const returnUrl = `https://nextplate.app/dashboard/${uid}/payments`;

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

	return (
		<div className={`${styles.BankInfo} ${styles.flexCol}`}>
			<div className={`${styles.BankInfo__header} ${styles.flexRow}`}>
				<div className={`${styles.BankInfo__BoxHeader} ${styles.Box} `}>
					<h5>Payout Balance</h5>
					<h1>{profit}</h1>
				</div>

				{successMessage && (
					<Grid item xs={12} md={12}>
						<Collapse in={isSuccessAlertOpen}>
							<Alert
								severity="success"
								className={styles.Alert}
								onClose={() => {
									setIsSuccessAlertOpen(false);
								}}
							>
								<AlertTitle className={styles.AlertTitle}>
									Bank account connected.{" "}
								</AlertTitle>
								{successMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}
				{errorMessage && (
					<Grid item xs={12} md={12}>
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
					<Grid item xs={12} md={12}>
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

				{loading ? (
					<CircularProgress />
				) : (
					<div className={styles.paymentButton}>
						<Button
							variant="contained"
							size="large"
							fullWidth
							onClick={(e) => handleConnectStripe(e, stripeAccId)}
							sx={{ display: !detailsSubmitted ? undefined : "none" }}
						>
							+ Connect Bank
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

export default BankInfo;
