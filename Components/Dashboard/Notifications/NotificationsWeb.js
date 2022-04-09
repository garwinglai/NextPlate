import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/notifications/notificationsweb.module.css";
import NotificationRow from "./NotificationRow";

function NotificationsWeb({
	closeNotifications,
	uid,
	orderData,
	count,
	orderConfirmErrorMessage,
	orderPendingErrorMessage,
}) {
	const [orderCount, setOrderCount] = useState(count);
	console.log(orderData);
	function reduceOrder() {
		setOrderCount((prev) => prev - 1);
	}

	return (
		<div className={styles.NotificationsWeb}>
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

			{orderData.map((order, idx) => (
				<NotificationRow
					key={order.orderId}
					orderData={order}
					uid={uid}
					orderCount={orderCount}
					reduceOrder={reduceOrder}
					closeNotifications={closeNotifications}
				/>
			))}
		</div>
	);
}

export default NotificationsWeb;
