import React, { useState, forwardRef, useEffect } from "react";
import styles from "../../../styles/components/dashboard/payments/payment-history.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@mui/material";
import PaymentHistoryTab from "./PaymentHistoryTab";
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

function PaymentHistory({ bizId }) {
	const [selectedDates, setSelectedDates] = useState({
		startDate: new Date(),
		endDate: new Date(),
	});
	const [payouts, setPayouts] = useState([]);

	const { startDate, endDate } = selectedDates;

	useEffect(() => {
		getPayouts(bizId);
	}, []);

	const getPayouts = async (bizId) => {
		const payoutDocRef = collection(db, "biz", bizId, "payouts");
		try {
			const payoutSnapshot = await getDocs(payoutDocRef);
			let payoutArr = [];

			payoutSnapshot.forEach((doc) => {
				const data = doc.data();
				payoutArr.push(data);
			});

			setPayouts(payoutArr);
		} catch (error) {
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

	const handleSearchClick = () => {
		// TODO: handle search click
		// * Calculate total payout during period
		// * Get All payouts during period
		console.log(selectedDates);
	};

	return (
		<div className={`${styles.PaymentHistory} ${styles.Box}`}>
			<div className={`${styles.flexRow} ${styles.header}`}>
				<div className={`${styles.flexCol}`}>
					<h5>Total payout</h5>
					<h1>$0.00</h1>
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
						<h5>#ID</h5>
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
					payouts.map((item) => {
						return (
							<PaymentHistoryTab key={item.id} item={item} bizId={bizId} />
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
