import React, { useState } from "react";
import styles from "../../../../styles/components/dashboard/orders/ordertabcomponent.module.css";
import OrderAction from "./OrderAction";

const styleStatusBorder = (idx) => {
	let border;
	switch (idx) {
		case 0:
			border = {
				borderLeft: "3px solid var(--orange)",
				borderRight: "3px solid var(--orange)",
			};

			break;
		case 1:
			border = {
				borderLeft: "3px solid var(--light-green)",
				borderRight: "3px solid var(--light-green)",
			};
			break;
		case 3:
			border = {
				borderLeft: "3px solid var(--dark-blue)",
				borderRight: "3px solid var(--dark-blue)",
			};
			break;
		case 2:
		case 4:
		case 5:
			border = {
				borderLeft: "3px solid var(--dark-blue)",
				borderRight: "3px solid var(--dark-blue)",
			};
			break;

		default:
			break;
	}
	return border;
};

export default function OrderTabComponent({ userOrderDetails, item, bizId }) {
	const [isShow, setIsShow] = useState(false);

	const {
		customerName,
		orderId,
		status,
		statusIndex,
		endTime,
		pickupWindowId,
		subtotalAmt,
		bizTaxAmt,
		customerId,
		customerPhone,
	} = userOrderDetails;
	const { itemName, itemPrice, quantity } = item;

	// * ACTIONS ----------------------------------

	function handleViewOrderClick() {
		setIsShow((prev) => !prev);
	}

	return (
		<React.Fragment>
			<div
				className={`${styles.OrderTabComponent} ${styles.flexRow} ${
					statusIndex === 0 ? styles.statusReserved : styles.statusConfirmed
				}`}
				style={styleStatusBorder(statusIndex)}
				onClick={handleViewOrderClick}
			>
				<div className={`${styles.flexCol}`}>
					<p>{customerName}</p>
					<p>{customerPhone}</p>
				</div>
				<div className={`${styles.flexRow} ${styles.item}`}>
					<p className={`${styles.orderCount}`}>{quantity}x</p>
					<p>{itemName}</p>
				</div>
			</div>
			{isShow && (
				<OrderAction
					isShow={isShow}
					onClose={handleViewOrderClick}
					orderDetails={userOrderDetails}
					bizId={bizId}
				/>
			)}
		</React.Fragment>
	);
}
