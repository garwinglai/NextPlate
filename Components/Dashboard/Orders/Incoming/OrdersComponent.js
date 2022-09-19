import React, { useState } from "react";
import styles from "../../../../styles/components/dashboard/orders/ordersComponent.module.css";
import OrderTabComponent from "./OrderTabComponent";
import { Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import SuccessError from "../SuccessError";
import BizOrdersComponent from "./BizOrdersComponent";

function OrdersComponent({ tab, userData }) {
	const [handleOrderUpdates, setHandleOrderUpdates] = useState({
		errorMessage: "",
		successMessage: "",
		isOpen: false,
	});

	const { errorMessage, successMessage, isOpen } = handleOrderUpdates;

	function handleSuccessError(errorMessage, successMessage) {
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
			</div>

			<div className={`${styles.flexCol} ${styles.BoxContainer}`}>
				{tab === 0 &&
					userData.map((user) => {
						return (
							<BizOrdersComponent
								key={user.bizId}
								bizId={user.bizId}
								statusIndex={tab}
								bizName={user.bizName}
								handleSuccessError={handleSuccessError}
							/>
						);
					})}
			</div>
			<div className={`${styles.flexCol} ${styles.BoxContainer}`}>
				{tab === 1 &&
					userData.map((user) => {
						return (
							<BizOrdersComponent
								key={user.bizId}
								bizId={user.bizId}
								statusIndex={tab}
								bizName={user.bizName}
								handleSuccessError={handleSuccessError}
							/>
						);
					})}
			</div>
		</div>
	);
}

export default OrdersComponent;
