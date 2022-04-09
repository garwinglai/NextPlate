import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/dashboard/test/test-tab-orders.module.css";
import { useRouter } from "next/router";
import TestOrderAction from "./TestOrderAction";

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

export default function TestTabOrders({
	userOrderDetails,
	item,
	bizId,
	dayIndex,
	statusIndex,
	status,
	handleAction,
}) {
	const [popUpValues, setPopUpValues] = useState({
		isShow: false,
		popUpName: "",
	});

	const { isShow, popUpName } = popUpValues;

	const router = useRouter();

	// * ACTIONS ----------------------------------

	function handleViewOrderClick() {
		setPopUpValues({ isShow: true });
	}

	function closePopUp() {
		setPopUpValues({ isShow: false, popUpName: "" });
	}

	return (
		<React.Fragment>
			<div
				className={`${styles.OrderTabComponent} ${styles.flexRow} ${
					status === `Reserved` ? styles.statusReserved : styles.statusConfirmed
				}`}
				style={styleStatusBorder(statusIndex)}
				onClick={handleViewOrderClick}
			>
				<div className={`${styles.flexCol}`}>
					<p>Test Customer</p>
					<p>123-456-7890</p>
				</div>
				<div className={`${styles.flexRow}`}>
					<p className={`${styles.orderCount}`}>1x</p>
					<p>Test item</p>
				</div>
			</div>
			{isShow && (
				<TestOrderAction
					isShow={isShow}
					onClose={closePopUp}
					dayIndex={dayIndex}
					status={status}
					handleAction={handleAction}
				/>
			)}
		</React.Fragment>
	);
}
