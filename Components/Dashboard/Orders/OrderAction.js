import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import styles from "../../../styles/components/dashboard/orders/order-action.module.css";
import { updateOrder } from "../../../actions/dashboard/ordersCrud";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import DeclineCancelModal from "./DeclineCancelModal";

function OrderAction({
	isShow,
	onClose,
	orderDetails,
	bizId,
	dayIndex,
	handleSuccessError,
}) {
	const [showFilter, setShowFilter] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [onUpdateResponse, setOnUpdateResponse] = useState({
		loading: false,
		success: false,
		errMessage: "",
		successMessage: "",
	});

	const { loading, success, errMessage, successMessage } = onUpdateResponse;
	const {
		customerName,
		customerPhone,
		subtotalAmt,
		taxAmt,
		totalPriceAmt,
		shortDate,
		orderId,
		pickupWindow,
		cardUsed,
		payMethod,
		items,
		status,
		pickupWindowId,
		customerId,
		chargeId,
	} = orderDetails;

	const router = useRouter();

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
						name={
							status === "Reserved"
								? timeEpoch > endTimeEpoch + fiveMinMiliSec
									? "past"
									: "accept"
								: "complete"
						}
						onClick={handleClick}
					>
						{status === "Reserved" ? "Accept" : "Complete"}
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
				handleSuccessError={handleSuccessError}
				orderDetails={orderDetails}
				bizId={bizId}
				dayIndex={dayIndex}
				setIsOpen={setIsOpen}
				setOnUpdateResponse={setOnUpdateResponse}
				setShowFilter={setShowFilter}
			/>
		);
	}

	// * Action ------------------------------------------------------------

	async function handleClick(e) {
		setOnUpdateResponse({ loading: true, success: false, errMessage: "" });
		const { name } = e.target;
		if (name === "past") {
			console.log(name);
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Declined",
				2,
				"Business did not accept in time",
				dayIndex,
				pickupWindowId,
				null,
				null,
				null
			);
			if (resUpdate.success) {
				handleSuccessError("Time passed. Order declined.", null);
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		}

		if (name === "accept") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Confirmed",
				1,
				null,
				dayIndex,
				pickupWindowId,
				null,
				null,
				chargeId
			);
			if (resUpdate.success) {
				handleSuccessError(null, "Accepted.");
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
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
				subtotalAmt,
				taxAmt,
				null
			);
			if (resUpdate.success) {
				handleSuccessError(null, "Completed.");
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
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
										setIsOpen(false);
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
								style={{ display: status !== "Reserved" && "none" }}
							>
								{status === "Reserved" && "Pending"}
							</p>
							<p
								className={`${styles.Confirmed}`}
								style={{ display: status !== "Confirmed" && "none" }}
							>
								{status === "Confirmed" && "Pickup"}
							</p>
							{showDeclineButton()}
						</div>
						<div className={`${styles.flexRow} ${styles.Header}`}>
							<h3>{customerName}</h3>
							<div className={`${styles.Header__right} ${styles.flexRow}`}>
								<p>{pickupWindow}</p>
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
								<p>{items[0].itemPrice}</p>
								<p>{taxAmt}</p>
								<p>{totalPriceAmt}</p>
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
