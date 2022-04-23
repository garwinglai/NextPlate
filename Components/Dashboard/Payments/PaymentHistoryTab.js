import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/payments/payment-history-tab.module.css";
import PayoutModal from "./PayoutModal";

function PaymentHistoryTab({ item, bizId }) {
	const [showPayoutModal, setShowPayoutModal] = useState(false);

	const { id, payoutDate, totalSales, totalTaxAndFees, payoutAmt } = item;

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
					item={item}
					bizId={bizId}
				/>
			)}
			<div
				onClick={handleClick}
				className={`${styles.flexRow} ${styles.gridHeader} ${styles.paymentHistoryTab}`}
			>
				<div className={`${styles.justifyCenter}`}>
					<p>#jBPq1</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>1/31/2022</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>$500.99</p>
				</div>
				<div>
					<p>-$50.00</p>
				</div>
				<div className={`${styles.justifyCenter}`}>
					<p>$450.99</p>
				</div>
			</div>
		</React.Fragment>
	);
}

export default PaymentHistoryTab;
