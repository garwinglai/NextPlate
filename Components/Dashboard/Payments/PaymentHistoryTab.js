import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/payments/payment-history-tab.module.css";
import PayoutModal from "./PayoutModal";

function PaymentHistoryTab({ payout, bizIdArr }) {
	const [showPayoutModal, setShowPayoutModal] = useState(false);

	const {
		id,
		createdAt,
		startDateEpoch,
		endDateEpoch,
		startDateShort,
		endDateShort,
		totalSalesStr,
		totalSalesDouble,
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
	} = payout;

	function handleClick() {
		setShowPayoutModal((prev) => !prev);
	}

	function closePayoutModal() {
		setShowPayoutModal(false);
	}

	return (
		<React.Fragment>
			{showPayoutModal && (
				<PayoutModal
					open={showPayoutModal}
					close={handleClick}
					payout={payout}
					bizIdArr={bizIdArr}
				/>
			)}
			<div
				onClick={handleClick}
				className={`${styles.flexRow} ${styles.gridHeader} ${styles.paymentHistoryTab}`}
			>
				<div className={`${styles.justifyCenter}`}>
					<p>#{id.slice(0, 5)}</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>{startDateShort}</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>{endDateShort}</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>{paymentDateShort}</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>{totalSalesStr}</p>
				</div>
				<div>
					<p>{totalBizFeesStr}</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>{payoutAmtStr}</p>
				</div>
			</div>
		</React.Fragment>
	);
}

export default PaymentHistoryTab;
