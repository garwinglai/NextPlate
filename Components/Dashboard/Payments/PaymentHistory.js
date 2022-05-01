import React, { useState, forwardRef, useEffect } from "react";
import styles from "../../../styles/components/dashboard/payments/payment-history.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@mui/material";
import PaymentHistoryTab from "./PaymentHistoryTab";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";

function PaymentHistory({ bizId }) {
	const [selectedDates, setSelectedDates] = useState({
		startDate: new Date(),
		endDate: new Date(),
	});
	const [payouts, setPayouts] = useState([]);
	const [payoutAmount, setPayoutAmount] = useState(0);

	const { startDate, endDate } = selectedDates;

	useEffect(() => {
		getPayouts(bizId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bizId]);

	const getPayouts = async (bizId) => {
		const payoutDocRef = collection(db, "biz", bizId, "payouts");
		try {
			const payoutSnapshot = await getDocs(payoutDocRef);
			let payoutArr = [];
			let totalPayout = 0;

			payoutSnapshot.forEach((doc) => {
				const data = doc.data();
				const payoutAmt = data.payoutAmtDouble;

				totalPayout += payoutAmt;
				payoutArr.push(data);
			});

			setPayoutAmount(totalPayout);
			setPayouts(payoutArr);
		} catch (error) {
			console.log("getPayouts", error);
			// TODO: Handle Error
		}
	};

	// eslint-disable-next-line react/display-name
	const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => (
		<Button
			variant="contained"
			size="small"
			sx={{
				backgroundColor: "var(--light-btn-blue)",
				width: "fit-content",
				fontSize: " 14px",
			}}
			// className={styles.DateButton}
			onClick={onClick}
			ref={ref}
		>
			{value}
		</Button>
	));

	const handleSearchClick = async () => {
		// TODO: handle search click
		// * Calculate total payout during period
		// * Get All payouts during period

		const { endDate, startDate } = selectedDates;
		const correctedStartDate = new Date(startDate).setHours(0, 0, 0, 0);
		const correctedEndDate = new Date(endDate).setHours(23, 59, 59, 999);

		await getPayoutsInPeriod(bizId, correctedStartDate, correctedEndDate);
	};

	const getPayoutsInPeriod = async (
		bizId,
		correctedStartDate,
		correctedEndDate
	) => {
		console.log(correctedStartDate, correctedEndDate);
		const payoutsDocRef = collection(db, "biz", bizId, "payouts");
		const q = query(
			payoutsDocRef,
			where("endDateEpoch", ">=", correctedStartDate),
			where("endDateEpoch", "<=", correctedEndDate)
		);

		try {
			const payoutsSnapshot = await getDocs(q);
			let totalPayout = 0;
			let payoutsArr = [];

			payoutsSnapshot.forEach((doc) => {
				const data = doc.data();
				const payoutAmt = data.payoutAmtDouble;

				totalPayout += payoutAmt;
				payoutsArr.push(data);
			});

			setPayoutAmount(totalPayout);
			setPayouts(payoutsArr);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className={`${styles.PaymentHistory} ${styles.Box}`}>
			<div className={`${styles.flexRow} ${styles.header}`}>
				<div className={`${styles.flexCol}`}>
					<h5>Total payout</h5>
					<h1>${payoutAmount}</h1>
				</div>
				<div className={`${styles.flexRow} ${styles.dateGroup}`}>
					<div className={`${styles.flexRow} ${styles.datePair}`}>
						{" "}
						<p>From:</p>
						<DatePicker
							selected={startDate}
							onChange={(date) =>
								setSelectedDates((prev) => ({ ...prev, startDate: date }))
							}
							customInput={<ExampleCustomInput />}
						/>
					</div>
					<div className={`${styles.flexRow} ${styles.datePair}`}>
						{" "}
						<p>To:</p>
						<DatePicker
							selected={endDate}
							onChange={(date) =>
								setSelectedDates((prev) => ({ ...prev, endDate: date }))
							}
							customInput={<ExampleCustomInput />}
						/>
					</div>
				</div>
				<Button
					variant="contained"
					size="small"
					sx={{
						backgroundColor: "var(--btn-blue)",
						height: "fit-content",
						fontSize: "14px",
					}}
					onClick={handleSearchClick}
					// fullWidth
				>
					Search
				</Button>
			</div>
			<div className={`${styles.flexCol}`}>
				<div className={`${styles.flexRow} ${styles.gridHeader}`}>
					<div className={`${styles.justifyCenter}`}>
						<h5>#Id</h5>
					</div>
					<div className={`${styles.justifyCenter}`}>
						<h5>From</h5>
					</div>
					<div className={`${styles.justifyCenter}`}>
						<h5>To</h5>
					</div>
					<div className={`${styles.justifyCenter}`}>
						<h5>Date paid</h5>
					</div>
					<div className={`${styles.justifyCenter}`}>
						<h5>Total sales</h5>
					</div>
					<div>
						<h5>Tax & fees</h5>
					</div>
					<div className={`${styles.justifyCenter}`}>
						<h5>Payout</h5>
					</div>
				</div>

				{payouts.length > 0 ? (
					payouts.map((payout) => {
						return (
							<PaymentHistoryTab
								key={payout.id}
								payout={payout}
								bizId={bizId}
							/>
						);
					})
				) : (
					<p
						style={{
							color: "var(--light-gray)",
							textAlign: "center",
							fontSize: "14px",
							marginTop: "20px",
						}}
					>
						No payments
					</p>
				)}
			</div>
		</div>
	);
}

export default PaymentHistory;
