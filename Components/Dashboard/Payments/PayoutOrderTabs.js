import React from "react";
import styles from "../../../styles/components/dashboard/payments/payout-order-tabs.module.css";

function PayoutOrderTabs({ order, bizFeesStr }) {
	const { id, createdAt, items, bizTotalPrice } = order;
	const { itemName, itemPrice, quantity } = items[0];
	const { seconds, nanoseconds } = createdAt;
	const createdAtEpoch = (seconds + nanoseconds * 0.000000001) * 1000;
	const date = new Date(createdAtEpoch);
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const year = date.getFullYear();
	const formattedTime = month + "/" + day + "/" + year;

	console.log("id", id);

	return (
		<div className={`${styles.gridSix} ${styles.payoutOrderTabs}`}>
			<p className={`${styles.gridItem}`}>{id.slice(0, 5)}</p>
			<p className={`${styles.gridItem}`}>{formattedTime}</p>
			<p className={`${styles.gridItem}`}>{itemName}</p>
			<p className={`${styles.gridItem}`}>{itemPrice}</p>
			<p className={`${styles.gridItem}`}>{quantity}</p>
			<p className={`${styles.gridItem}`}>{bizFeesStr}</p>
			<p className={`${styles.gridItem}`}>{bizTotalPrice}</p>
		</div>
	);
}

export default PayoutOrderTabs;
