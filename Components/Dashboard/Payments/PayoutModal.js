import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import styles from "../../../styles/components/dashboard/payments/payout-modal.module.css";
import PayoutOrderTabs from "./PayoutOrderTabs";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "1px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function PayoutModal({ open, close }) {
	const [openModal, setOpenModal] = useState(true);

	function handleClose() {
		close();
		setOpenModal(false);
	}

	return (
		<React.Fragment>
			<Modal
				open={open}
				onClose={close}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div className={`${styles.flexCol} ${styles.container}`}>
						<div className={`${styles.flexRow} ${styles.justifySpaceBetween}`}>
							<Button color="error" size="small">
								Close
							</Button>

							<div
								className={`${styles.flexCol} ${styles.alignEnd} ${styles.fromToDate}`}
							>
								<h6 className={`${styles.titleGap}`}>Payment period</h6>
								<p>1/1/2022 - 1/31/2022</p>
							</div>
						</div>
						<div
							className={`${styles.flexRow} ${styles.gap100} ${styles.justifySpaceBetween} ${styles.paymentToInfo}`}
						>
							<div className={`${styles.flexCol}`}>
								<h6 className={`${styles.titleGap}`}>Payment no.</h6>
								<p>391400123210</p>
							</div>
							<div className={`${styles.flexCol} ${styles.alignEnd}`}>
								<h6 className={`${styles.titleGap}`}>Payment date</h6>
								<p>Feb 2, 2022</p>
							</div>
						</div>
						<div
							className={`${styles.flexRow} ${styles.gap100} ${styles.justifySpaceBetween} ${styles.clientInfo}`}
						>
							<div className={`${styles.flexCol}`}>
								<h6 className={`${styles.titleGap}`}>Client information</h6>
								<p>John Doe</p>
								<p>123 addy st.</p>
								<p>city state zip</p>
							</div>
							<div className={`${styles.flexCol} ${styles.alignEnd}`}>
								<h6 className={`${styles.titleGap}`}>Payment to</h6>
								<p>Restaurant LLC</p>
							</div>
						</div>
						<div className={`${styles.gridSix} ${styles.gridBorder}`}>
							<h5 className={`${styles.gridItem}`}>#Id</h5>
							<h5 className={`${styles.gridItem}`}>Date</h5>
							<h5 className={`${styles.gridItem}`}>Item</h5>
							<h5 className={`${styles.gridItem}`}>Qty</h5>
							<h5 className={`${styles.gridItem}`}>Tax & Fees</h5>
							<h5 className={`${styles.gridItem}`}>Total</h5>
						</div>
						<PayoutOrderTabs />
						<div
							className={`${styles.flexRow} ${styles.justifyEnd} ${styles.totalPayoutAndFees}`}
						>
							<div className={`${styles.flexCol} ${styles.subtotalGap}`}>
								<h5>Subtotal</h5>
								<h5>Tax & Fees</h5>
								<h5>Total Payout</h5>
							</div>
							<div
								className={`${styles.flexCol} ${styles.alignEnd} ${styles.subtotalGap}`}
							>
								<p>$12.99</p>
								<p>$1.00</p>
								<p>$1.99</p>
							</div>
						</div>
						<p>NextPlate</p>
					</div>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default PayoutModal;
