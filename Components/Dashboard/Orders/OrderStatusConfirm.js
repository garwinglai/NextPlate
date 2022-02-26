import React, { useState } from "react";
import { updateOrder } from "../../../actions/dashboard/ordersCrud";
import { useRouter } from "next/router";
import { CircularProgress } from "@mui/material";
import styles from "../../../styles/components/dashboard/orders/orderstatusconfirm.module.css";
import Image from "next/image";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import MyLoader from "../../../helper/MyLoader";

function OrderStatusConfirm({
	popUpName,
	onClose,
	orderId,
	bizId,
	userOrderDetails,
	itemPrice,
	dayIndex,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [declineReasons, setDeclineReasons] = useState("Supply shortage");
	const [onUpdateResponse, setOnUpdateResponse] = useState({
		loading: false,
		success: false,
		errMessage: "",
		successMessage: "",
	});

	const { loading, success, errMessage, successMessage } = onUpdateResponse;
	const { pickupWindowId, subtotalAmt, taxAmt, customerId, chargeId } =
		userOrderDetails;
	const router = useRouter();
	// * Actions -----------------------------------------------------------------------------------------

	async function handleClick(e) {
		setOnUpdateResponse({ loading: true, success: false, errMessage: "" });
		const { name } = e.target;

		if (name === "past") {
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
				setOnUpdateResponse({ loading: false, success: true, errMessage: "" });
				setTimeout(() => {
					router.replace(router.asPath);
				}, 1000);
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		}

		if (name === "confirm") {
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
				setOnUpdateResponse({
					loading: false,
					success: true,
					errMessage: "",
					successMessage: resUpdate.paymentMessage,
				});
				setTimeout(() => {
					router.replace(router.asPath);
				}, 1000);
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		} else if (name === "decline") {
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
				setOnUpdateResponse({
					loading: false,
					success: true,
					errMessage: "",
					successMessage: resUpdate.message,
				});
				setTimeout(() => {
					router.replace(router.asPath);
				}, 1000);
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		} else if (name === "cancel") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"Cancelled",
				4,
				declineReasons,
				dayIndex,
				pickupWindowId,
				subtotalAmt,
				taxAmt,
				chargeId
			);
			if (resUpdate.success) {
				setOnUpdateResponse({
					loading: false,
					success: true,
					errMessage: "",
					successMessage: resUpdate.paymentMessage,
				});
				setTimeout(() => {
					router.replace(router.asPath);
				}, 1000);
			} else {
				setIsOpen(true);
				setOnUpdateResponse({
					loading: false,
					success: false,
					errMessage: resUpdate.message,
				});
			}
		} else if (name === "no-show") {
			const resUpdate = await updateOrder(
				customerId,
				orderId,
				bizId,
				"No Show",
				5,
				null,
				dayIndex,
				pickupWindowId,
				subtotalAmt,
				taxAmt,
				null
			);
			if (resUpdate.success) {
				setOnUpdateResponse({
					loading: false,
					success: true,
					errMessage: "",
					successMessage: resUpdate.message,
				});
				setTimeout(() => {
					router.replace(router.asPath);
				}, 1000);
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
	function handleChange(e) {
		const { value } = e.target;
		setDeclineReasons(value);
	}

	// * Display --------------------------------------------------------------------------------------------

	function showConfirmDisplay(popUpName) {
		if (popUpName === "Confirm") {
			const time = new Date();
			const timeEpoch = Date.parse(time);
			const endTimeEpoch = userOrderDetails.endTime;
			const fiveMinMiliSec = 300000;

			if (timeEpoch > endTimeEpoch + fiveMinMiliSec) {
				return (
					<>
						<Image
							loader={MyLoader}
							src="https://img.icons8.com/stickers/50/000000/alarm-clock.png"
							alt="alarm clock icon"
							width="50px"
							height="50px"
						/>
						<p>
							This order&apos;s pick up time has past.
							<br /> The order has been declined. The customer was not charged.
						</p>
						<Button
							variant="contained"
							color="error"
							name="past"
							size="medium"
							onClick={handleClick}
						>
							I understand
						</Button>
					</>
				);
			} else {
				return (
					<>
						<Image
							loader={MyLoader}
							alt="task completed icon"
							width="50px"
							height="50px"
							src="https://img.icons8.com/stickers/50/000000/task-completed--v2.png"
						/>
						<p>
							You are confirming this order.
							<br /> The customer will be <u>charged</u>.
						</p>

						{loading ? (
							<CircularProgress />
						) : errMessage ? (
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
						) : (
							<Button
								variant="contained"
								name="confirm"
								size="medium"
								onClick={handleClick}
							>
								{success ? "Success" : "Confirm"}
							</Button>
						)}
					</>
				);
			}
		} else if (popUpName === "Decline") {
			return (
				<>
					<Image
						loader={MyLoader}
						alt="cancel icon"
						width="50px"
						height="50px"
						src="https://img.icons8.com/stickers/100/000000/cancel.png"
					/>
					<p>
						You are declining this order. <br />
						The customer will not be charged.
					</p>
					<div>
						<label htmlFor="decline-reasons">Please select a reason: </label>
						<select
							name="decline-reasons"
							id="decline-reasons"
							value={declineReasons}
							onChange={handleChange}
						>
							<option>Supply shortage</option>
							<option>Store closed early</option>
						</select>
					</div>
					{loading ? (
						<CircularProgress />
					) : errMessage ? (
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
					) : (
						<Button
							variant="contained"
							color="error"
							size="medium"
							name="decline"
							onClick={handleClick}
						>
							{success ? "Success" : "Decline"}
						</Button>
					)}
				</>
			);
		} else if (popUpName === "Cancel") {
			return (
				<>
					<Image
						loader={MyLoader}
						alt="cancel icon"
						width="50px"
						height="50px"
						src="https://img.icons8.com/stickers/100/000000/cancel.png"
					/>
					<p>
						You are cancelling this order and the customer will be refuned.
						<br />
						Please note: you will incur the <u>credit card fee</u> for this
						process.
					</p>
					<div>
						<label htmlFor="decline-reasons">Please select a reason: </label>
						<select
							name="decline-reasons"
							id="decline-reasons"
							value={declineReasons}
							onChange={handleChange}
						>
							<option>Supply shortage</option>
							<option>Store closed early</option>
						</select>
					</div>
					{loading ? (
						<CircularProgress />
					) : errMessage ? (
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
					) : (
						<Button
							variant="contained"
							color="error"
							size="medium"
							name="cancel"
							onClick={handleClick}
						>
							{success ? "Success" : "Cancel"}
						</Button>
					)}
				</>
			);
		} else if (popUpName === "No Show") {
			return (
				<>
					<Image
						loader={MyLoader}
						alt="delete icon"
						width="50px"
						height="50px"
						src="https://img.icons8.com/stickers/50/000000/delete-shield.png"
					/>
					<p>
						You are marking this order as a <b>No Show</b>. You will still
						receive the payment for this order.
					</p>
					{loading ? (
						<CircularProgress />
					) : errMessage ? (
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
					) : (
						<Button
							variant="contained"
							size="medium"
							name="no-show"
							onClick={handleClick}
						>
							{success ? "Success" : "No Show"}
						</Button>
					)}
				</>
			);
		}
	}

	return (
		<div className={styles.OrderStatusConfirm}>
			<div className={styles.OrderStatusConfirm__opacityBG}></div>
			<div className={styles.OrderStatusConfirm__popUP}>
				<Button variant="text" color="error" onClick={onClose}>
					Close
				</Button>
				<div className={styles.OrderStatusConfirm__body}>
					{showConfirmDisplay(popUpName)}
				</div>
			</div>
		</div>
	);
}

export default OrderStatusConfirm;
