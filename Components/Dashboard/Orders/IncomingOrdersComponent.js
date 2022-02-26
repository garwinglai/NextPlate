import React from "react";
import styles from "../../../styles/components/dashboard/orders/incoming-orders-component.module.css";
import OrderTabComponent from "./OrderTabComponent";

function IncomingOrdersComponent({ date, orderDataArr, bizId, from }) {
	const {
		weekDayNameShort,
		shortDate,
		statusTodayOrTomorrow,
		actualDate,
		dayIndex,
	} = date;

	// * Display --------------------------------
	function loadStatuses() {
		let pending = 0;
		let active = 0;
		let completed = 0;

		for (let i = 0; i < orderDataArr.length; i++) {
			const currOrder = orderDataArr[i];
			if (currOrder.shortDate === shortDate) {
				if (currOrder.status === "Reserved") {
					pending = pending + 1;
				} else if (currOrder.status === "Confirmed") {
					active = active + 1;
				} else if (currOrder.status === "Completed") {
					completed = completed + 1;
				}
			}
		}

		if (from === "dashboard") {
			return (
				<p>
					<span style={{ color: "var(--orange)", fontSize: "12px" }}>
						{" "}
						{pending} Pending
					</span>
					<span>|</span>
					<span style={{ color: "var(--light-green)", fontSize: "12px" }}>
						{" "}
						{active} Active
					</span>
					<span>|</span>
					<span style={{ color: "var(--dark-blue)", fontSize: "12px" }}>
						{" "}
						{completed} Completed
					</span>
				</p>
			);
		} else {
			return (
				<p>
					<span style={{ color: "var(--orange)" }}> {pending} Pending</span>
					<span>|</span>
					<span style={{ color: "var(--light-green)" }}> {active} Active</span>
					<span>|</span>
					<span style={{ color: "var(--dark-blue)" }}>
						{" "}
						{completed} Completed
					</span>
				</p>
			);
		}
	}

	return (
		<div
			className={styles.IncomingOrdersComponent__container}
			style={
				from === "dashboard" ? { width: "100%", height: "300px" } : undefined
			}
		>
			{statusTodayOrTomorrow === 0 ? (
				<h4 style={{ margin: "0 0 5px 20px" }}>Today</h4>
			) : (
				<h4 style={{ margin: "0 0 5px 20px", visibility: "hidden" }}>Today</h4>
			)}

			<div
				className={styles.IncomingOrdersComponent}
				style={from === "dashboard" ? { backgroundColor: "white" } : undefined}
			>
				<div className={styles.IncomingOrdersComponent__Header}>
					<h4>{actualDate}</h4>
				</div>
				{loadStatuses()}
				<div
					className={styles.IncomingOrdersComponent__Body}
					style={
						from === "dashboard" ? { width: "90%", height: "200px" } : undefined
					}
				>
					{orderDataArr.length === 0 ? (
						<p className={styles.IncomingOrdersComponent__noOrders}>
							No orders
						</p>
					) : (
						orderDataArr.map((userOrderDetails, index) => {
							if (userOrderDetails.shortDate === shortDate) {
								return (
									<React.Fragment key={index}>
										<h4>{userOrderDetails.pickupWindow}</h4>
										{userOrderDetails.items.map((item, i) => {
											return (
												<OrderTabComponent
													dayIndex={dayIndex}
													userOrderDetails={userOrderDetails}
													item={item}
													key={userOrderDetails.orderId}
													bizId={bizId}
												/>
											);
										})}
									</React.Fragment>
								);
							}
						})
					)}
				</div>
			</div>
		</div>
	);
}

export default IncomingOrdersComponent;
