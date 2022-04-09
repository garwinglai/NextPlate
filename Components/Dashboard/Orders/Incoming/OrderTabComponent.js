import React, { useEffect, useState } from "react";
import styles from "../../../../styles/components/dashboard/orders/ordertabcomponent.module.css";
import { useRouter } from "next/router";
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

export default function OrderTabComponent({
	pendingCount,
	audio,
	userOrderDetails,
	item,
	bizId,
	dayIndex,
	handleSuccessError,
}) {
	const [customerPhoneDisplay, setCustomerPhoneDisplay] = useState();
	const [popUpValues, setPopUpValues] = useState({
		isShow: false,
		popUpName: "",
	});
	const [onUpdateResponse, setOnUpdateResponse] = useState({
		loading: false,
		success: false,
		errMessage: "",
		successMessage: "",
	});

	const { isShow, popUpName } = popUpValues;
	const { loading, success, errMessage, successMessage } = onUpdateResponse;
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

	const router = useRouter();

	useEffect(() => {
		let customerNumArr;
		if (userOrderDetails.customerPhone) {
			customerNumArr = userOrderDetails.customerPhone.split("").slice(2);

			let customerNum = [];

			for (let i = 0; i < customerNumArr.length; i++) {
				const curr = customerNumArr[i];
				if (i === 0) {
					customerNum.push("(", curr);
				} else if (i === 2) {
					customerNum.push(curr, ")", " ");
				} else if (i === 5) {
					customerNum.push(curr, " ");
				} else {
					customerNum.push(curr);
				}
			}
			setCustomerPhoneDisplay(customerNum.join(""));
		}
	}, [userOrderDetails]);

	// * ACTIONS ----------------------------------

	function handleViewOrderClick() {
		setPopUpValues({ isShow: true });
	}
	console.log(status);
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
					<p>{customerName}</p>
					<p>{customerPhoneDisplay}</p>
				</div>
				<div className={`${styles.flexRow}`}>
					<p className={`${styles.orderCount}`}>{quantity}x</p>
					<p>{itemName}</p>
				</div>
			</div>
			{isShow && (
				<OrderAction
					pendingCount={pendingCount}
					audio={audio}
					handleSuccessError={handleSuccessError}
					isShow={isShow}
					onClose={closePopUp}
					orderDetails={userOrderDetails}
					bizId={bizId}
					dayIndex={dayIndex}
				/>
			)}
		</React.Fragment>
	);
}
