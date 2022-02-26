import React from "react";
import styles from "../../../styles/components/dashboard/orders/orderhistorytabcomp.module.css";
import { Avatar } from "@mui/material";

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
		totalPriceAmt,
		quantity,
	} = order;

	function statusColor(status) {
		if (
			status === "Declined" ||
			status === "Cancelled" ||
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
			<p className={styles.justifyEndItem}>#{orderId.slice(0, 5)}</p>
			<p className={styles.justifyStartItem}>{shortDate}</p>
			<p>{customerName}</p>

			<p>{items && items[0].itemName}</p>
			<p className={styles.justifyEndItem}>{items && items[0].quantity}x</p>
			<p className={styles.justifyStartItem}>{totalPriceAmt}</p>
			<p style={statusColor(status)} className={styles.justifyStartItem}>
				{status}
			</p>
		</div>
	);
}

export default OrderHistoryTabComponent;
