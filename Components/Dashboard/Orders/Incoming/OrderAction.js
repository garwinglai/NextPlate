import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import styles from "../../../../styles/components/dashboard/orders/order-action.module.css";
import { updateOrder } from "../../../../actions/dashboard/ordersCrud";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import DeclineCancelModal from "./DeclineCancelModal";
import playNotificationSound from "../../../../helper/PlayAudio";
import {
	getLocalStorage,
	removeLocalStorage,
	setLocalStorage,
} from "../../../../actions/auth/auth";

function OrderAction({ isShow, onClose, orderDetails, bizId }) {
	const [showFilter, setShowFilter] = useState(false);
	const [onUpdateResponse, setOnUpdateResponse] = useState({
		loading: false,
		errMessage: "",
		isOpen: false,
	});

	const { loading, errMessage, isOpen } = onUpdateResponse;
	const {
		customerName,
		customerPhone,
		subtotalAmt,
		bizTaxAmt,
		bizTotalPrice,
		bizTotalPriceDouble,
		shortDate,
		orderId,
		pickupWindow,
		setPickupTime,
		cardUsed,
		payMethod,
		items,
		status,
		statusIndex,
		pickupWindowId,
		customerId,
		chargeId,
		endTime,
	} = orderDetails;

	const style = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		bgcolor: "background.paper",
		filter: showFilter && "brightness(50%)",
		border: "2px solid #000",
		boxShadow: 24,
		p: 4,
		borderRadius: "5px",
	};

	// * Display ------------------------------------------------------------

	function showAcceptButton() {
		const time = new Date();
		const timeEpoch = Date.parse(time);
		const endTimeEpoch = orderDetails.endTime;
		const fiveMinMiliSec = 300000;

		return (
			<React.Fragment>
				{loading ? (
					<CircularProgress />
				) : (
					<Button
						variant="contained"
						fullWidth
						name={statusIndex === 0 ? "accept" : "complete"}
						onClick={handleClick}
					>
						{statusIndex === 0 ? "Accept" : "Complete"}
					</Button>
				)}
			</React.Fragment>
		);
	}

	function showDeclineButton() {
		const time = new Date();
		const timeEpoch = Date.parse(time);
		const endTimeEpoch = orderDetails.endTime;

		return (
			<DeclineCancelModal
				timeEpoch={timeEpoch}
				endTimeEpoch={endTimeEpoch}
				orderDetails={orderDetails}
				bizId={bizId}
				setOnUpdateResponse={setOnUpdateResponse}
				setShowFilter={setShowFilter}
			/>
		);
	}

	// * Action ------------------------------------------------------------

	async function handleClick(e) {
		setOnUpdateResponse({ loading: true, errMessage: "" });
		const { name } = e.target;
		handleLSIncOrder(name);

		if (name === "accept") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Confirmed",
				1,
				null,
				bizTotalPriceDouble,
				chargeId,
				payMethod,
				endTime
			);
			if (!resUpdate.success) {
				setOnUpdateResponse({
					loading: false,
					isOpen: true,
					errMessage: resUpdate.message,
				});
			}
		} else if (name === "complete") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Completed",
				3,
				null,
				null,
				pickupWindowId,
				null,
				null,
				null,
				null
			);
			if (!resUpdate.success) {
				setOnUpdateResponse({
					loading: false,
					isOpen: true,
					errMessage: resUpdate.message,
				});
			}
		}
	}

	function handleLSIncOrder(action) {
		const incOrderLS = JSON.parse(getLocalStorage("incOrder"));

		if (action === "complete") {
			let incOrder = { ...incOrderLS, isViewed: false };
			setLocalStorage("incOrder", incOrder);
		} else {
			let incOrder = { ...incOrderLS, isViewed: true };
			setLocalStorage("incOrder", incOrder);
		}
	}

	return (
		<div>
			<Modal
				open={isShow}
				onClose={() => onClose()}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style} className={styles.Box}>
					{errMessage && (
						<Grid item xs={12} md={12} mt={2}>
							<Collapse in={isOpen}>
								<Alert
									severity="error"
									onClose={() => {
										setOnUpdateResponse({
											loading: false,
											isOpen: false,
											errMessage: "",
										});
									}}
								>
									<AlertTitle>Error</AlertTitle>
									{errMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					<div className={`${styles.OrderAction}`}>
						<div className={`${styles.Decline__status} ${styles.flexRow}`}>
							<p
								className={`${styles.Reserved}`}
								style={{ display: statusIndex !== 0 && "none" }}
							>
								{statusIndex === 0 && "Pending"}
							</p>
							<p
								className={`${styles.Confirmed}`}
								style={{ display: statusIndex !== 1 && "none" }}
							>
								{statusIndex === 1 && "Pickup"}
							</p>
							{showDeclineButton()}
						</div>
						<div className={`${styles.flexRow} ${styles.Header}`}>
							<h3>{customerName}</h3>
							<div className={`${styles.Header__right} ${styles.flexRow}`}>
								{setPickupTime ? (
									<p>Pickup {setPickupTime}</p>
								) : (
									<p>{pickupWindow}</p>
								)}
							</div>
						</div>
						<div className={`${styles.paymentInfo}`}>
							<p>Payment method: {payMethod}</p>
							<p>{cardUsed}</p>
						</div>
						<div className={`${styles.items} ${styles.flexRow}`}>
							<div className={`${styles.items__left} ${styles.flexRow}`}>
								<p>{items[0].quantity}x</p>
								<p>{items[0].itemName}</p>
							</div>
							<p>{items[0].itemPrice}</p>
						</div>
						<div className={`${styles.totals} ${styles.flexRow}`}>
							<div className={`${styles.flexCol} ${styles.totals__left}`}>
								<p>Subtotal</p>
								<p>Tax</p>
								<p>
									<b>Total</b>
								</p>
							</div>
							<div className={`${styles.flexCol} ${styles.totals__right}`}>
								<p>${subtotalAmt.toFixed(2)}</p>
								<p>${bizTaxAmt.toFixed(2)}</p>
								<p>{bizTotalPrice}</p>
							</div>
						</div>
						{showAcceptButton()}
					</div>
				</Box>
			</Modal>
		</div>
	);
}

export default OrderAction;
