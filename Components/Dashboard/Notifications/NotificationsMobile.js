import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/notifications/notificationsmobile.module.css";
import NotificationRow from "./NotificationRow";
import { Button } from "@mui/material";

function NotificationsMobile({
	closeNotifications,
	uid,
	orderData,
	count,
	orderConfirmErrorMessage,
	orderPendingErrorMessage,
}) {
	const [orderCount, setOrderCount] = useState(count);

	function reduceOrder() {
		setOrderCount((prev) => prev - 1);
	}

	return (
		<div className={styles.NotificationsMobile}>
			{orderConfirmErrorMessage && (
				<NotificationRow
					uid={uid}
					orderCount={orderCount}
					reduceOrder={reduceOrder}
					closeNotifications={closeNotifications}
					orderConfirmErrorMessage={orderConfirmErrorMessage}
				/>
			)}
			{orderPendingErrorMessage && (
				<NotificationRow
					uid={uid}
					orderCount={orderCount}
					reduceOrder={reduceOrder}
					closeNotifications={closeNotifications}
					orderPendingErrorMessage={orderPendingErrorMessage}
				/>
			)}

			{orderCount && orderCount === 0 ? (
				<div
					style={{
						textAlign: "center",
						paddingTop: "100px",
						color: "var(--gray)",
					}}
				>
					<p>No notifications</p>
				</div>
			) : (
				orderData.map((order, idx) => (
					<NotificationRow
						key={order.orderId}
						orderData={order}
						uid={uid}
						orderCount={orderCount}
						reduceOrder={reduceOrder}
						closeNotifications={closeNotifications}
					/>
				))
			)}
			<Button color="error" sx={{ mt: 5 }} onClick={closeNotifications}>
				Close
			</Button>
		</div>
	);
}

export default NotificationsMobile;
