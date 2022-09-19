import React, { useEffect } from "react";
import styles from "../../../styles/components/dashboard/payments/payout-order-tabs.module.css";

function PayoutOrderTabs({ order, bizFeesDouble, isBizFeesPct, bizFeesStr }) {
	const {
		id,
		createdAt,
		items,
		bizTotalPrice,
		bizTotalPriceDouble,
		subtotalAmt,
	} = order;
	const { itemName, itemPrice, itemPriceDouble, quantity } = items[0];
	const { seconds, nanoseconds } = createdAt;
	const createdAtEpoch = (seconds + nanoseconds * 0.000000001) * 1000;
	const date = new Date(createdAtEpoch);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const year = date.getFullYear();
	const formattedTime = month + "/" + day + "/" + year;

	const payAmount = isBizFeesPct
		? bizTotalPriceDouble * (1 - bizFeesDouble / 100)
		: bizTotalPriceDouble - bizFeesDouble;

	const fees = isBizFeesPct
		? subtotalAmt * (bizFeesDouble / 100)
		: bizFeesDouble;

	// const payAmout = (itemPrice - bizFeesStr).toString();

	return (
		<div className={`${styles.gridSix} ${styles.payoutOrderTabs}`}>
			<p className={`${styles.gridItem}`}>{id.slice(0, 5)}</p>
			<p className={`${styles.gridItem}`}>{formattedTime}</p>
			<p className={`${styles.gridItem}`}>{itemName}</p>
			<p className={`${styles.gridItem}`}>{bizTotalPrice}</p>
			<p className={`${styles.gridItem}`}>{quantity}</p>
			<p className={`${styles.gridItem}`}>${fees.toFixed(2)}</p>
			<p className={`${styles.gridItem}`}>${payAmount.toFixed(2)}</p>
		</div>
	);
}

export default PayoutOrderTabs;
