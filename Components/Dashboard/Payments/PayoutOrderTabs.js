import React from "react";
import styles from "../../../styles/components/dashboard/payments/payout-order-tabs.module.css";

function PayoutOrderTabs({ order, bizFeesStr }) {
	const { id, createdAt, items, bizTotalPrice } = order;
	const [itemName, itemPrice, quantity] = items;

	return (
		<div className={`${styles.gridSix} ${styles.payoutOrderTabs}`}>
			<p className={`${styles.gridItem}`}>#jb2313</p>
			<p className={`${styles.gridItem}`}>1/05/2022</p>
			<p className={`${styles.gridItem}`}>Milk Tea</p>
			<p className={`${styles.gridItem}`}>1</p>
			<p className={`${styles.gridItem}`}>-$1.00</p>
			<p className={`${styles.gridItem}`}>$2.99</p>
		</div>
	);
}

export default PayoutOrderTabs;
