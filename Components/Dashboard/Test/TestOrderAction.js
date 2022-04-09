import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import styles from "../../../styles/components/dashboard/test/test-order-action.module.css";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import DeclineModalTest from "./DeclineModalTest";

function OrderAction({ isShow, onClose, dayIndex, status, handleAction }) {
	const [showFilter, setShowFilter] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

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
		return (
			<React.Fragment>
				<Button
					variant="contained"
					fullWidth
					name={status === "Reserved" ? "accept" : "complete"}
					onClick={handleClick}
				>
					{status === "Reserved" ? "Accept" : "Complete"}
				</Button>
			</React.Fragment>
		);
	}

	function showDeclineButton() {
		return (
			<DeclineModalTest
				dayIndex={dayIndex}
				setIsOpen={setIsOpen}
				setShowFilter={setShowFilter}
				status={status}
				handleAction={handleAction}
				onClose={onClose}
			/>
		);
	}

	// * Action ------------------------------------------------------------

	async function handleClick(e) {
		const { name } = e.target;
		console.log(name);
		if (name === "accept") {
			handleAction(name);
			onClose();
		}
		if (name === "complete") {
			handleAction(name);
			onClose();
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
							<h3>Test Customer</h3>
							<div className={`${styles.Header__right} ${styles.flexRow}`}>
								<p>5:00pm - 6:00pm</p>
							</div>
						</div>
						<div className={`${styles.paymentInfo}`}>
							<p>TEST Payment method: VISA</p>
							<p>**** 4242</p>
						</div>
						<div className={`${styles.items} ${styles.flexRow}`}>
							<div className={`${styles.items__left} ${styles.flexRow}`}>
								<p>1x</p>
								<p>Test item</p>
							</div>
							<p>$5.99</p>
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
								<p>$5.99</p>
								<p>$0.63</p>
								<p>$6.62</p>
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
