import React, { useState } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Button } from "@mui/material";
import styles from "../../../styles/components/dashboard/test/decline-modal-test.module.css";

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
	dayIndex,
	setIsOpen,
	setShowFilter,
	status,
	handleAction,
	onClose,
}) {
	const [open, setOpen] = useState(false);
	const [handleDeclineCancel, setHandleDeclineCancel] = useState({
		declineReasons: "Supply shortage",
		showDeclineCancelModal: false,
		declineOrCancel: "",
	});

	const { declineReasons, showDeclineCancelModal, declineOrCancel } =
		handleDeclineCancel;

	const handleClose = () => {
		console.log("hi");
		setOpen(false);
	};

	function handleChange(e) {
		const { value } = e.target;
		setHandleDeclineCancel((prev) => ({ ...prev, declineReasons: value }));
	}

	const handleOpen = async (e) => {
		setShowFilter(true);
		const { name } = e.target;

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

	function handleDeclineAndCancel(e) {
		const { name } = e.target;

		handleAction(name);
		handleClose();
		onClose();
		setShowFilter(false);
	}

	return (
		<React.Fragment>
			<Button
				color="error"
				name={status === "Confirmed" ? "cancel" : "decline"}
				onClick={handleOpen}
			>
				{status === "Confirmed" ? "Cancel" : "Decline"}
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
						name={declineOrCancel === "decline" ? "decline" : "cancel"}
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
