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
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function RemoveSchedule({ bizId, open, close, schedules, timeDisplay }) {
	console.log(schedules, timeDisplay);
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
					{timeDisplay
						.sort((a, b) => {
							if (a.hourStart === b.hourStart) {
								return a.minStart - b.minStart;
							} else {
								return a.hourStart - b.hourStart;
							}
						})
						.map((time, i) => {
							return (
								<div className={`${styles.RemoveSchedule}`} key={i}>
									<p className={`${styles.PickupTime}`}>{time.timeDisplay}</p>
									{schedules.map((schedule) => {
										if (schedule.timeDisplay === time.timeDisplay) {
											return (
												<RemoveScheduleTab
													bizId={bizId}
													schedule={schedule}
													key={schedule.id}
												/>
											);
										}
									})}
								</div>
							);
						})}
				</div>
			</Box>
		</Modal>
	);
}

export default RemoveSchedule;
