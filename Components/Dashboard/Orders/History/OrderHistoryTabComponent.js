import React from "react";
import styles from "../../../../styles/components/dashboard/orders/orderhistorytabcomp.module.css";

//TODO: Add items array to each other - remove condition

function OrderHistoryTabComponent({ order }) {
	const {
		orderId,
		shortDate,
		customerName,
		items,
		status,
		endTime,
		itemName,
		bizTotalPrice,
		quantity,
	} = order;

	function statusColor(status) {
		if (
			status === "Declined" ||
			status === "Canceled" ||
			status === "No Show"
		) {
			return {
				color: "white",

				backgroundColor: "var(--red)",
				padding: "2px 5px",
				textAlign: "center",
				borderRadius: "5px",
			};
		} else if (status === "Completed") {
			return {
				color: "white",
				backgroundColor: "var(--btn-blue)",
				padding: "2px 5px",
				textAlign: "center",
				borderRadius: "5px",
			};
		}
	}

	return (
		<div className={styles.OrderHistoryTabComponent}>
			<p className={`${styles.justifyStartItem} ${styles.paddingLeft}`}>
				#{orderId.slice(0, 5)}
			</p>
			<p className={styles.justifyEndItem}>{shortDate}</p>
			<p className={`${styles.justifyStartItem}`}>{customerName}</p>

			<p className={styles.textAlignCenter}>{items && items[0].itemName}</p>
			<p className={styles.justifyEndItem}>{items && items[0].quantity}x</p>
			<p className={styles.justifyStartItem}>{bizTotalPrice}</p>
			<p style={statusColor(status)} className={styles.justifyCenter}>
				{status}
			</p>
		</div>
	);
}

export default OrderHistoryTabComponent;
