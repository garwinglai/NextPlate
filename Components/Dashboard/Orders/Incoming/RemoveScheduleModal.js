import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import { Button } from "@mui/material";
import styles from "../../../../styles/components/dashboard/orders/remove-schedule-modal.module.css";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function RemoveScheduleModal({
	openRemove,
	removeScheduleId,
	closeRemove,
	canRemove,
	dayOfWkIdx,
	handleRemoveSchedule,
	openErrorModal,
	errorMessage,
	isRecur,
	destination,
	isPaused,
}) {
	const removeSchedule = (e) => {
		if (destination === "schedule") {
			handleRemoveSchedule(removeScheduleId, dayOfWkIdx);
		} else {
			handleRemoveSchedule(e, removeScheduleId, dayOfWkIdx);
		}

		closeRemove();
	};

	return (
		<Modal
			open={openRemove}
			onClose={closeRemove}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={style}>
				<div className={`${styles.ConfirmRemove__Container}`}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						{canRemove ? "Removing set schedule" : "Can't remove"}
					</Typography>
					<Typography id="modal-modal-description" sx={{ mt: 3, mb: 4 }}>
						{!isPaused
							? canRemove
								? isRecur
									? "Removing a recurring schedule will remove all future schedules. We recommend to pause instead. Click CLOSE and turn Recur Off. Save."
									: "Are you sure you want to remove the schedule?"
								: "Cannot remove posts after pickup time."
							: "Paused schedules cannot be removed."}
					</Typography>
					<div style={{ marginBottom: "20px" }}>
						{canRemove && (
							<Button
								variant="contained"
								color="error"
								sx={{ mr: 5 }}
								onClick={removeSchedule}
								disabled={isPaused}
							>
								Remove
							</Button>
						)}
						<Button variant="outlined" onClick={closeRemove}>
							Close
						</Button>
					</div>
					<Collapse in={openErrorModal}>
						<Alert severity="error">{errorMessage}</Alert>
					</Collapse>
				</div>
			</Box>
		</Modal>
	);
}

export default RemoveScheduleModal;
