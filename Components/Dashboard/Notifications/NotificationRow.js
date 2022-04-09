import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/notifications/notificationsrow.module.css";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { Button } from "@mui/material";
import { useRouter } from "next/router";

function NotificationRow({
	uid,
	orderData,
	orderCount,
	closeNotifications,
	reduceOrder,
	orderConfirmErrorMessage,
	orderPendingErrorMessage,
}) {
	const [open, setOpen] = useState(true);

	const router = useRouter();

	function handleClose() {
		setOpen(false);
		reduceOrder();

		if (orderCount && orderCount === 1) {
			closeNotifications();
		}
	}

	return (
		<div className={styles.NotificationRow}>
			{orderConfirmErrorMessage && (
				<Collapse in={open}>
					<Alert
						severity="error"
						onClose={handleClose}
						style={{ borderBottom: "3px solid var(--light-red)" }}
					>
						<AlertTitle>Error</AlertTitle>
						{orderConfirmErrorMessage}
					</Alert>
				</Collapse>
			)}
			{orderPendingErrorMessage && (
				<Collapse in={open}>
					<Alert
						severity="error"
						onClose={handleClose}
						style={{ borderBottom: "3px solid var(--light-red)" }}
					>
						<AlertTitle>Error</AlertTitle>
						{orderPendingErrorMessage}
					</Alert>
				</Collapse>
			)}
			{orderData && orderData.status === "Reserved" && (
				<Collapse
					in={open}
					className={styles.Collapse}
					onClick={() => {
						closeNotifications();
						router.push(`/dashboard/${uid}/orders/incoming-orders`);
					}}
				>
					<Alert
						severity="warning"
						onClose={handleClose}
						style={{ borderBottom: "2px solid var(--green)" }}
						className={styles.AlertPending}
					>
						<AlertTitle className={styles.AlertTitle}>Pending order</AlertTitle>
						<p className={styles.AlertParagraph}>
							View order for{" "}
							<b>
								<u>{orderData.customerName}</u>
							</b>
						</p>
					</Alert>
				</Collapse>
			)}
			{orderData && orderData.status === "Confirmed" && (
				<Collapse
					in={open}
					className={styles.Collapse}
					onClick={() => {
						closeNotifications();
						router.push(`/dashboard/${uid}/orders/incoming-orders`);
					}}
				>
					<Alert
						severity="success"
						onClose={handleClose}
						style={{ borderBottom: "2px solid var(--green)" }}
						className={styles.AlertConfirmed}
					>
						<AlertTitle className={styles.AlertTitle}>Pickup order</AlertTitle>
						<p className={styles.AlertParagraph}>
							{orderData.pickupWindow}{" "}
							<b>
								<u>{orderData.customerName}</u>
							</b>
						</p>
					</Alert>
				</Collapse>
			)}
		</div>
	);
}

export default NotificationRow;
