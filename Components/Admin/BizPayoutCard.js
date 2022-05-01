import React from "react";
import styles from "../../styles/components/admin/biz-payout-card.module.css";

function BizPayoutCard({ payout }) {
	const {
		bizId,
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
		numOrders,
		totalStripeFeesStr,
		nextPlateRevenueStr,
		totalCanceledStripeFeesStr,
	} = payout;

	const { fullAddress } = address;

	return (
		<div className={styles.BizPayoutCard}>
			<div className={`${styles.flexRow}`}>
				<div className={`${styles.flexCol}`}>
					<p>Id: {bizId}</p>
					<p>Paid to: {paidToName}</p>
					<p>Client name: {clientName}</p>
					<p>Address: {fullAddress}</p>
					<p>From: {startDateShort}</p>
					<p>To: {endDateShort}</p>
					<p>Payment date: {paymentDateShort}</p>
				</div>
				<div className={`${styles.flexCol}`}>
					<p>Number of orders: {numOrders}</p>
					<p>Total sales: {totalSalesStr}</p>
					<p>Business fees: {bizFeesStr}</p>
					<p>Total business fees: {totalBizFeesStr}</p>
					<p>Total stripe fees: {totalStripeFeesStr}</p>
					<p>Total cancel fees: {totalCanceledStripeFeesStr}</p>
					<p>NextPlate revenue: {nextPlateRevenueStr}</p>
					<p>Payout amount: {payoutAmtStr}</p>
				</div>
			</div>
		</div>
	);
}

export default BizPayoutCard;
