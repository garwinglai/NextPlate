import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/orders/ordersComponent.module.css";
import OrderTabComponent from "./OrderTabComponent";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import SuccessError from "./SuccessError";

function OrdersComponent({
	date,
	tab,
	uid,
	bizId,
	ordersPending,
	pickupWindowsPending,
	hasPendingToday,
	hasPendingTomorrow,
	ordersConfirmed,
	pickupWindowsConfirmed,
	hasConfirmedToday,
	hasConfirmedTomorrow,
	ordersPendingMessage,
	ordersConfirmedMessage,
}) {
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const [handleOrderUpdates, setHandleOrderUpdates] = useState({
		errorMessage: "",
		successMessage: "",
		isOpen: false,
	});

	const { errorMessage, successMessage, isOpen } = handleOrderUpdates;
	const {
		weekDayNameShort,
		shortDate,
		statusTodayOrTomorrow,
		actualDate,
		dayIndex,
	} = date;

	function handleSuccessError(errorMessage, successMessage) {
		console.log(errorMessage, successMessage);
		setHandleOrderUpdates((prev) => ({
			...prev,
			errorMessage,
			successMessage,
			isOpen: true,
		}));
	}

	return (
		<div className={`${styles.OrdersComponent}`}>
			<div className={`${styles.DateHeader}`}>
				{(errorMessage || successMessage) && (
					<SuccessError
						handleOrderUpdate={handleOrderUpdates}
						setHandleOrderUpdates={setHandleOrderUpdates}
					/>
				)}
				<h3>{actualDate}</h3>
				{ordersPendingMessage && (
					<Grid item xs={12} md={4}>
						<Collapse in={isAlertOpen}>
							<Alert severity="error">
								<AlertTitle>Error</AlertTitle>
								{ordersPendingMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}
				{ordersConfirmedMessage && (
					<Grid item xs={12} md={4}>
						<Collapse in={isAlertOpen}>
							<Alert severity="error">
								<AlertTitle>Error</AlertTitle>
								{ordersConfirmedMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}

				{!ordersPendingMessage && !ordersConfirmedMessage && (
					<Grid item xs={12} md={8}>
						<Collapse in={isAlertOpen}>
							{tab === 0 ? (
								<Alert severity="info" className={styles.Alert}>
									<AlertTitle className={styles.AlertTitle}>
										Click order to accept.
									</AlertTitle>
									Orders automatically <u>declined</u> at end of day.
								</Alert>
							) : (
								<Alert severity="info" className={styles.Alert}>
									<AlertTitle className={styles.AlertTitle}>
										Click order to Complete.
									</AlertTitle>
									Orders automatically <u>completed</u> at end of day.
								</Alert>
							)}
						</Collapse>
					</Grid>
				)}
			</div>
			<div className={`${styles.flexRow}`}>
				{tab === 0 && (
					<div className={`${styles.Box}`}>
						<h3>Pending</h3>
						{hasPendingToday ? (
							ordersPending &&
							ordersPending.length !== 0 &&
							pickupWindowsPending.map((pickup, idx) => {
								if (pickup.shortDate === shortDate) {
									return (
										<div className={styles.orderGroup} key={pickup.window}>
											<p>{pickup.window}</p>
											{ordersPending.map((pendingOrder, i) => {
												if (
													pendingOrder.shortDate === shortDate &&
													pendingOrder.pickupWindow === pickup.window
												) {
													return (
														<OrderTabComponent
															handleSuccessError={handleSuccessError}
															key={pendingOrder.orderId}
															userOrderDetails={pendingOrder}
															item={pendingOrder.items[0]}
															bizId={bizId}
														/>
													);
												}
											})}
										</div>
									);
								}
							})
						) : (
							<p className={`${styles.noData}`}>No pending orders</p>
						)}
					</div>
				)}
				{tab === 1 && (
					<div className={`${styles.Box}`}>
						<h3>Pickup</h3>
						{hasConfirmedToday ? (
							ordersConfirmed &&
							ordersConfirmed.length !== 0 &&
							pickupWindowsConfirmed.map((pickup, idx) => {
								if (pickup.shortDate === shortDate) {
									return (
										<div className={styles.orderGroup} key={pickup.window}>
											<p>{pickup.window}</p>
											{ordersConfirmed.map((confirmedOrder, i) => {
												if (
													confirmedOrder.shortDate === shortDate &&
													confirmedOrder.pickupWindow === pickup.window
												) {
													return (
														<OrderTabComponent
															handleSuccessError={handleSuccessError}
															key={confirmedOrder.orderId}
															userOrderDetails={confirmedOrder}
															item={confirmedOrder.items[0]}
															bizId={bizId}
														/>
													);
												}
											})}
										</div>
									);
								}
							})
						) : (
							<p className={`${styles.noData}`}>No confirmed orders</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

export default OrdersComponent;
