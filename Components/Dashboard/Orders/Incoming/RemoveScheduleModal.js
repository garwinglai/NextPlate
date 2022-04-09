import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { removeSchedule } from "../../../../actions/dashboard/scheduleCrud";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import { Button } from "@mui/material";

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
	bizId,
	openRemove,
	removeScheduleId,
	closeRemove,
	canRemove,
	dayOfWkIdx,
}) {
	const [removeRes, setRemoveRes] = useState({
		errorMessage: "",
		openErrorModal: false,
	});

	const { errorMessage, openErrorModal } = removeRes;

	const handleRemoveSchedule = async (e, removeScheduleId, dayOfWkIdx) => {
		const { success, message } = await removeSchedule(
			bizId,
			removeScheduleId,
			dayOfWkIdx,
			null
		);

		if (success) {
			setRemoveRes((prev) => ({
				...prev,
				errorMessage: "",
				openErrorModal: false,
			}));
			closeRemove();
		} else {
			console.log(`error removing schedule on orders: ${message}`);
			setRemoveRes((prev) => ({
				...prev,
				errorMessage: "Error removing.",
				openErrorModal: true,
			}));
		}
	};

	return (
		<Modal
			open={openRemove}
			onClose={() => {
				setRemoveRes((prev) => ({
					...prev,
					errorMessage: "",
					openErrorModal: false,
				}));
				closeRemove();
			}}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={style}>
				<Typography id="modal-modal-title" variant="h6" component="h2">
					{canRemove ? "Removing set schedule" : "Can't remove"}
				</Typography>
				<Typography id="modal-modal-description" sx={{ mt: 2, mb: 2 }}>
					{canRemove
						? "Are you sure you want to remove the schedule?"
						: "Cannot remove posts during pickup time."}
				</Typography>
				<div style={{ marginBottom: "20px" }}>
					{canRemove && (
						<Button
							variant="contained"
							color="error"
							sx={{ mr: 5 }}
							onClick={(e) =>
								handleRemoveSchedule(e, removeScheduleId, dayOfWkIdx)
							}
						>
							Remove
						</Button>
					)}
					<Button
						variant="outlined"
						onClick={() => {
							setRemoveRes((prev) => ({
								...prev,
								errorMessage: "",
								openErrorModal: false,
							}));
							closeRemove();
						}}
					>
						Close
					</Button>
				</div>
				<Collapse in={openErrorModal}>
					<Alert severity="error">{errorMessage}</Alert>
				</Collapse>
			</Box>
		</Modal>
	);
}

export default RemoveScheduleModal;
