import React, { useState } from "react";
// import OrderTabComponent from "./OrderTabComponent";
import { Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import styles from "../../../styles/components/dashboard/test/test-order-component.module.css";
import TestTabOrders from "./TestTabOrders";

function TestOrdersComponent({
	date,
	tab,
	pendingArray,
	confirmedArray,
	statusIndex,
	status,
	handleAction,
}) {
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const {
		weekDayNameShort,
		shortDate,
		statusTodayOrTomorrow,
		actualDate,
		dayIndex,
	} = date;
	console.log(pendingArray);
	return (
		<div className={`${styles.OrdersComponent}`}>
			<div className={`${styles.DateHeader}`}>
				{/* <h3>{actualDate}</h3> */}
			</div>
			<div className={`${styles.flexRow}`}>
				{tab === 0 && (
					<div className={`${styles.Box}`}>
						<h3>Test Pending</h3>
						{pendingArray.length !== 0 ? (
							pendingArray.map((count) => {
								return (
									<div className={styles.orderGroup} key={count}>
										<p>5:00pm - 6:00pm</p>

										<TestTabOrders
											statusIndex={statusIndex}
											status={status}
											handleAction={handleAction}
										/>
									</div>
								);
							})
						) : (
							<p className={`${styles.noData}`}>No pending orders</p>
						)}
					</div>
				)}
				{tab === 1 && (
					<div className={`${styles.Box}`}>
						<h3>Test Pickup</h3>
						{confirmedArray.length !== 0 ? (
							confirmedArray.map((count) => {
								return (
									<div className={styles.orderGroup} key={count}>
										<p>5:00pm - 6:00pm</p>
										<TestTabOrders
											statusIndex={statusIndex}
											status={status}
											handleAction={handleAction}
										/>
									</div>
								);
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

export default TestOrdersComponent;
