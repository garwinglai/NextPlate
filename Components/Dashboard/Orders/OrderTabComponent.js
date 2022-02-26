import React, { useEffect, useState } from "react";
import styles from "../../../styles/components/dashboard/orders/ordertabcomponent.module.css";
import { CircularProgress, ClickAwayListener } from "@mui/material";
import { updateOrder } from "../../../actions/dashboard/ordersCrud";
import { useRouter } from "next/router";
import { Button, Grid } from "@mui/material";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import PhoneInput from "react-phone-input-2";
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
		taxAmt,
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

	function closePopUp() {
		setPopUpValues({ isShow: false, popUpName: "" });
	}

	return (
		<React.Fragment>
			<Button
				className={`${styles.OrderTabComponent} ${styles.flexRow}`}
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
			</Button>
			{isShow && (
				<OrderAction
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
