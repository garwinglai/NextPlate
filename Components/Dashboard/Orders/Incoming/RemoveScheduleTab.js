import React, { useState } from "react";
import { Button } from "@mui/material";
import styles from "../../../../styles/components/dashboard/orders/remove-schedule-tab.module.css";
import RemoveScheduleModal from "./RemoveScheduleModal";
import { removeSchedule } from "../../../../actions/dashboard/scheduleCrud";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";

const keyFlash = {
	borderLeft: "3px solid var(--flash)",
	borderRight: "3px solid var(--flash)",
};
const keyGreen = {
	borderLeft: "3px solid var(--light-green)",
	borderRight: "3px solid var(--light-green)",
};
const keyGray = {
	borderLeft: "3px solid var(--gray)",
	borderRight: "3px solid var(--gray)",
};
const keyRed = {
	borderLeft: "3px solid var(--light-red)",
	borderRight: "3px solid var(--light-red)",
};
const keyOrange = {
	color: "var(--orange)",
	fontWeight: "500",
};

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

function RemoveScheduleTab({ bizId, schedule }) {
	const [scheduleRemove, setScheduleRemove] = useState({
		openRemoveModal: false,
		canRemove: false,
		removeScheduleId,
	});
	const [removeRes, setRemoveRes] = useState({
		errorMessage: "",
		openErrorModal: false,
	});

	const { errorMessage, openErrorModal } = removeRes;
	const { openRemoveModal, canRemove, removeScheduleId } = scheduleRemove;
	const {
		endTime,
		numAvailable,
		itemPrice,
		itemName,
		recurring,
		dayOfWkIdx,
		id,
	} = schedule;

	const handleRemove = () => {
		const currDate = new Date();
		const currEpoch = Date.parse(currDate);

		if (currEpoch > endTime) {
			setScheduleRemove((prev) => ({
				...prev,
				openRemoveModal: true,
				canRemove: false,
			}));
		} else {
			setScheduleRemove((prev) => ({
				...prev,
				openRemoveModal: true,
				canRemove: true,
				removeScheduleId: id,
			}));
		}
	};

	const handleRemoveSchedule = async (e, removeScheduleId, dayOfWkIdx) => {
		const { success, message } = await removeSchedule(
			bizId,
			removeScheduleId,
			dayOfWkIdx,
			null
		);

		if (!success) {
			console.log(`error removing schedule on orders: ${message}`);
			setRemoveRes((prev) => ({
				...prev,
				errorMessage: "Error removing.",
				openErrorModal: true,
			}));
		}
	};

	function RemoveScheduleModal() {
		return (
			<Modal
				open={openRemoveModal}
				onClose={() => {
					setRemoveRes((prev) => ({
						...prev,
						errorMessage: "",
						openErrorModal: false,
					}));
					setScheduleRemove((prev) => ({
						...prev,
						openRemoveModal: false,
						removeScheduleId: "",
					}));
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
								setScheduleRemove((prev) => ({
									...prev,
									openRemoveModal: false,
									removeScheduleId: "",
								}));
							}}
						>
							Close
						</Button>
					</div>
					{openErrorModal && (
						<Collapse in={openErrorModal}>
							<Alert severity="error">{errorMessage}</Alert>
						</Collapse>
					)}
				</Box>
			</Modal>
		);
	}

	return (
		<div
			className={`${styles.RemoveScheduleTab}`}
			style={
				endTime > Date.parse(new Date())
					? numAvailable > 0
						? keyGreen
						: keyGray
					: keyGray
			}
		>
			<p
				className={`${styles.Status}`}
				style={{
					backgroundColor:
						endTime > Date.parse(new Date())
							? numAvailable > 0
								? "var(--light-green)"
								: "var(--light-red)"
							: "var(--gray)",
				}}
			>
				{endTime > Date.parse(new Date())
					? numAvailable > 0
						? "Live"
						: "Sold out"
					: "Past"}
			</p>
			<p>{itemPrice}</p>
			<div className={`${styles.Quantity}`}>
				<p>{numAvailable}x</p>
				<p>{itemName}</p>
			</div>
			<p
				style={{
					color: "var(--gray)",
					textDecoration: recurring ? "none" : "line-through",
				}}
			>
				recur
			</p>
			<Button variant="text" color="error" onClick={handleRemove}>
				remove
			</Button>
			{openRemoveModal && RemoveScheduleModal()}
		</div>
	);
}

export default RemoveScheduleTab;
