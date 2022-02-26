import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/notifications/notificationsrow.module.css";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";

function NotificationRow({
	uid,
	notifications,
	errorMessage,
	orderData,
	orderCount,
	closeNotifications,
	reduceOrder,
	handleClickAway,
}) {
	const [open, setOpen] = useState(true);

	// const { numOrdersUnnoticed, errorMessage, orderData } = notifications;

	function handleClose() {
		setOpen(false);

		reduceOrder();
		if (orderCount && orderCount === 1) {
			handleClickAway();
			if (closeNotifications) {
				closeNotifications();
			}
		}
	}

	return (
		<div className={styles.NotificationRow}>
			{errorMessage ? (
				<Collapse in={open}>
					<Alert
						severity="error"
						onClose={handleClose}
						style={{ borderBottom: "3px solid var(--light-red)" }}
					>
						<AlertTitle>Error</AlertTitle>
						{errorMessage}
					</Alert>
				</Collapse>
			) : (
				<Collapse in={open}>
					<Alert
						severity="success"
						onClose={handleClose}
						style={{ borderBottom: "3px solid var(--green)" }}
					>
						<Link href={`/dashboard/${uid}/orders/incoming-orders`}>
							<a>
								<AlertTitle>Order </AlertTitle>
								<p style={{ fontSize: "14px" }}>
									View order from <b>{orderData.customerName}</b>.
								</p>
							</a>
						</Link>
					</Alert>
				</Collapse>
			)}
		</div>
	);
}

export default NotificationRow;
