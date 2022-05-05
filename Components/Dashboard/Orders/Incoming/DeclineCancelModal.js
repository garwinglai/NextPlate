import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { updateOrder } from "../../../../actions/dashboard/ordersCrud";
import { Button } from "@mui/material";
import styles from "../../../../styles/components/dashboard/orders/declinecancelmodal.module.css";
import {
	getLocalStorage,
	setLocalStorage,
} from "../../../../actions/auth/auth";
import playNotificationSound from "../../../../helper/PlayAudio";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "fit-content",
	padding: "100px 30px",
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function DeclineCancelModal({
	pendingCount,
	audio,
	timeEpoch,
	endTimeEpoch,
	handleSuccessError,
	orderDetails,
	bizId,
	dayIndex,
	setIsOpen,
	setOnUpdateResponse,
	setShowFilter,
}) {
	const [open, setOpen] = useState(false);
	const [handleDeclineCancel, setHandleDeclineCancel] = useState({
		declineReasons: "Supply shortage",
		showDeclineCancelModal: false,
		declineOrCancel: "",
	});

	const { declineReasons, showDeclineCancelModal, declineOrCancel } =
		handleDeclineCancel;
	const {
		customerName,
		customerPhone,
		subtotalAmt,
		bizTaxAmt,
		bizTotalPrice,
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

	const handleClose = () => {
		setOpen(false);
	};

	function handleChange(e) {
		const { value } = e.target;
		setHandleDeclineCancel((prev) => ({ ...prev, declineReasons: value }));
	}

	const handleOpen = async (e) => {
		setShowFilter(true);
		const { name } = e.target;

		if (name === "no-show") {
			handleLSIncOrder(name);
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"No Show",
				5,
				null,
				dayIndex,
				pickupWindowId,
				null,
				null,
				null
			);
			if (resUpdate.success) {
				handleSuccessError("Marked as No Show.", null);
			} else {
				// Open error message
				setIsOpen(true);
				// Close Child Modal
				setOpen(false);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		}

		if (name === "decline") {
			setOpen(true);
			setHandleDeclineCancel((prev) => ({
				...prev,
				declineOrCancel: "decline",
			}));
		}

		if (name === "cancel") {
			setOpen(true);
			setHandleDeclineCancel((prev) => ({
				...prev,
				declineOrCancel: "cancel",
			}));
		}
	};

	async function handleDeclineAndCancel() {
		handleLSIncOrder(declineOrCancel);
		if (declineOrCancel === "decline") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Declined",
				2,
				declineReasons,
				dayIndex,
				pickupWindowId,
				null,
				null,
				null
			);
			if (resUpdate.success) {
				playNotificationSound(audio, "end");
				// handleSuccessError(null, "Declined.");
			} else {
				// Open error message
				setIsOpen(true);
				// Close child modal
				setOpen(false);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		} else if (declineOrCancel === "cancel") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Canceled",
				4,
				declineReasons,
				dayIndex,
				pickupWindowId,
				bizTotalPriceDouble,
				chargeId
			);
			if (resUpdate.success) {
				// handleSuccessError(null, "Canceled.");
			} else {
				// Open error message
				setIsOpen(true);
				// Close child modal
				setOpen(false);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		}
	}

	function handleLSIncOrder(action) {
		const incOrderLS = JSON.parse(getLocalStorage("incOrder"));

		if (action === "decline") {
			let incOrder = { ...incOrderLS, isViewed: true };
			setLocalStorage("incOrder", incOrder);
		} else {
			let incOrder = { ...incOrderLS, isViewed: false };
			setLocalStorage("incOrder", incOrder);
		}
	}

	return (
		<React.Fragment>
			<Button
				color="error"
				variant="contained"
				name={
					status === "Confirmed"
						? timeEpoch > endTimeEpoch
							? "no-show"
							: "cancel"
						: "decline"
				}
				onClick={handleOpen}
			>
				{status === "Confirmed"
					? timeEpoch > endTimeEpoch
						? "No Show"
						: "Cancel"
					: "Decline"}
			</Button>
			<Modal
				hideBackdrop
				open={open}
				aria-labelledby="child-modal-title"
				aria-describedby="child-modal-description"
			>
				<Box sx={{ ...style }} className={styles.Box}>
					<p
						className={styles.Exit}
						onClick={() => {
							handleClose();
							setShowFilter(false);
						}}
					>
						Close
					</p>
					<div className={styles.reasonBox}>
						<h2 id="child-modal-title" className={styles.title}>
							{declineOrCancel === "decline"
								? "Reason for decline:"
								: "Reason for cancel:"}
						</h2>
						<div>
							<select
								name="decline-reasons"
								id="decline-reasons"
								value={declineReasons}
								className={styles.declineOptions}
								onChange={handleChange}
							>
								<option>Supply shortage</option>
								<option>Store closed early</option>
							</select>
						</div>
					</div>
					<Button
						onClick={handleDeclineAndCancel}
						variant="contained"
						color="error"
						className={styles.declineButton}
					>
						{" "}
						{declineOrCancel === "decline" ? "Decline" : "Cancel"}
					</Button>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default DeclineCancelModal;
