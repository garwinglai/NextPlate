import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import RemoveScheduleTab from "./RemoveScheduleTab";
import styles from "../../../../styles/components/dashboard/orders/remove-schedule-component.module.css";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	width: "max-content",
	transform: "translate(-50%, -50%)",
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function RemoveSchedule({
	bizId,
	open,
	close,
	activeSchedules,
	pausedSchedules,
	timeDisplay,
}) {
	return (
		<Modal
			open={open}
			onClose={close}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={style}>
				<div
					className={`${styles.marginBottom} ${styles.BoxHeight} ${styles.RemoveSchedule__Container}`}
				>
					<h1>Current schedules</h1>
					{activeSchedules.concat(pausedSchedules).length === 0 ? (
						<p className={`${styles.NoPosts}`}>No posts.</p>
					) : (
						activeSchedules
							.concat(pausedSchedules)
							.sort((a, b) => a.endTime - b.endTime)
							.map((schedule) => {
								return (
									<div className={`${styles.RemoveSchedule}`} key={schedule.id}>
										<p className={`${styles.PickupTime}`}>
											{schedule.timeDisplay}
										</p>
										<RemoveScheduleTab bizId={bizId} schedule={schedule} />
									</div>
								);
							})
					)}
				</div>
			</Box>
		</Modal>
	);
}

export default RemoveSchedule;
