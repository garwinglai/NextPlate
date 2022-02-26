import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/notifications/notificationsweb.module.css";
import NotificationRow from "./NotificationRow";

function NotificationsWeb({
	uid,
	orderLength,
	handleClickAway,
	notifications,
}) {
	const [orderCount, setOrderCount] = useState(orderLength);
	const { numOrdersUnnoticed, errorMessage, orderData } = notifications;

	function reduceOrder() {
		setOrderCount((prev) => prev - 1);
	}

	return (
		<div className={styles.NotificationsWeb}>
			{errorMessage ? (
				<NotificationRow
					errorMessage={errorMessage}
					orderCount={orderCount}
					reduceOrder={reduceOrder}
					uid={uid}
					handleClickAway={handleClickAway}
				/>
			) : (
				orderData.map((order, idx) => (
					<NotificationRow
						key={order.orderId}
						notifications={notifications}
						orderData={order}
						orderCount={orderCount}
						reduceOrder={reduceOrder}
						uid={uid}
						handleClickAway={handleClickAway}
					/>
				))
			)}
		</div>
	);
}

export default NotificationsWeb;
