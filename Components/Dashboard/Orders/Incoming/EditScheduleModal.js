import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import styles from "../../../../styles/components/dashboard/orders/editschedulemodal.module.css";
import RemoveScheduleModal from "./RemoveScheduleModal";
import {
	collection,
	query,
	where,
	onSnapshot,
	doc,
	getDocs,
	getDoc,
	setDoc,
	writeBatch,
	deleteField,
	updateDoc,
} from "firebase/firestore";
import { db } from "../../../../firebase/fireConfig";

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

function EditScheduleModal({
	isPaused,
	bizId,
	isOpen,
	close,
	handleRemoveSchedule,
	handlePauseSchedule,
	dayIdx,
	scheduleId,
	editDisabled,
	handleRemove,
	openRemove,
	closeRemove,
	canRemove,
	openErrorModal,
	errorMessage,
	destination,
	schedule,
}) {
	const [isToggleOn, setIsToggleOn] = useState(isPaused ? isPaused : false);
	const [isToggleChanged, setIsToggleChanged] = useState(false);

	const handleToggleChange = (e) => {
		setIsToggleOn((prev) => !prev);
		setIsToggleChanged((prev) => !prev);
	};

	const handleSaveRecurEdit = async (e) => {
		const bizDocRef = doc(db, "biz", bizId);
		const bizSnapshot = await getDoc(bizDocRef);

		// * if isToggleOn = true, unpause. If isToggleOn = false, pause.
		if (bizSnapshot.exists()) {
			const bizData = bizSnapshot.data();

			// * UnPause
			if (!isToggleOn) {
				const pausedSchedules = bizData.pausedSchedules;
				let currPausedSchedule = pausedSchedules[dayIdx][scheduleId];
				currPausedSchedule.isPaused = false;

				const removedPausedSchedule = await removePausedSchedule(
					pausedSchedules,
					bizDocRef,
					scheduleId,
					dayIdx
				);

				if (removedPausedSchedule) {
					const isWeeklyScheduleSaved = await saveWeeklySchedule(
						bizDocRef,
						currPausedSchedule,
						dayIdx
					);

					if (isWeeklyScheduleSaved) {
						close();
					} else {
						// cannot remove paused Schedule
					}
				} else {
					// weekly not saved
				}
			}

			// * Pause
			if (isToggleOn) {
				const weeklySchedules = bizData.weeklySchedules;
				let currSchedule = weeklySchedules[dayIdx][scheduleId];
				currSchedule.isPaused = true;

				const isScheduleRemoved = await removeScheduleTemp(scheduleId, dayIdx);

				if (isScheduleRemoved) {
					const isPausedScheduleSaved = await savePausedSchedule(
						bizDocRef,
						currSchedule,
						dayIdx
					);

					if (isPausedScheduleSaved) {
						close();
					} else {
						// error could not save paused schedule
					}
				} else {
					// Log Error Allert couldnt remove schedule
				}
			}
		} else {
			// biz incorrect, throw error
		}
	};

	const saveWeeklySchedule = async (bizDocRef, currPausedSchedule, dayIdx) => {
		const openHistoryRef = doc(db, "biz", bizId, "openHistory", scheduleId);

		try {
			await updateDoc(bizDocRef, {
				[`weeklySchedules.${dayIdx}.${scheduleId}`]: currPausedSchedule,
			});
		} catch (error) {
			console.log("problem saving weeklySchedule", error);
			return false;
		}

		try {
			await updateDoc(openHistoryRef, {
				recurring: true,
				status: "Regular",
				statusIndex: 0,
				pausedBy: "",
				pausedAt: null,
			});

			return true;
		} catch (error) {
			console.log("problem updating paused openHistory", error);
			return false;
		}
	};

	const removePausedSchedule = async (
		pausedSchedules,
		bizDocRef,
		scheduleId,
		dayIdx
	) => {
		const arrayOfPausedSchedules = Object.keys(pausedSchedules[dayIdx]);
		const pausedSchedArrayLength = arrayOfPausedSchedules.length;

		if (pausedSchedArrayLength <= 1) {
			console.log("less than one");
			try {
				await updateDoc(bizDocRef, {
					[`pausedSchedules.${dayIdx}`]: deleteField(),
				});

				return true;
			} catch (error) {
				console.log("error removing pausedSchedule", error);

				return false;
			}
		} else {
			console.log("more than one");
			try {
				await updateDoc(bizDocRef, {
					[`pausedSchedules.${dayIdx}.${scheduleId}`]: deleteField(),
				});

				return true;
			} catch (error) {
				console.log("error removing pausedSchedule", error);

				return false;
			}
		}
	};

	const savePausedSchedule = async (bizDocRef, currSchedule, dayIdx) => {
		try {
			await updateDoc(
				bizDocRef,
				{
					[`pausedSchedules.${dayIdx}.${scheduleId}`]: currSchedule,
				},
				{ merge: true }
			);
			return true;
		} catch (e) {
			console.log("problem saving paused schedule", e);
			return false;
		}
	};

	const removeScheduleTemp = async (scheduleId, dayIdx) => {
		if (destination === "schedule") {
			try {
				await handleRemoveSchedule(scheduleId, dayIdx);
				return true;
			} catch (error) {
				console.log("error removing schedule", error);
				return false;
			}
		} else {
			try {
				await handlePauseSchedule(null, scheduleId, dayIdx);
				return true;
			} catch (error) {
				console.log("error removing schedule", error);
				return false;
			}
		}
	};

	const handleRemoveClick = () => {
		if (destination === "schedule") {
			handleRemove(schedule);
		} else {
			handleRemove();
		}
	};

	return (
		<Modal
			open={isOpen}
			onClose={close}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={style}>
				<div className={`${styles.EditSchedule__Container}`}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						Edit Recurring Schedule
					</Typography>

					{editDisabled && (
						<Typography id="modal-modal-description" sx={{ mt: 4 }}>
							Cannot edit. Schedule has passed.
						</Typography>
					)}
					<div className={`${styles.Flex} ${styles.Toggle__Container}`}>
						<Typography id="modal-modal-description" sx={{ mt: 5, mb: 5 }}>
							<FormControlLabel
								disabled={editDisabled}
								label={"Pause"}
								labelPlacement="end"
								control={
									<Switch
										checked={isToggleOn}
										onChange={handleToggleChange}
										size="large"
									/>
								}
							/>
						</Typography>
						<Button
							disabled={!isToggleChanged}
							variant="contained"
							onClick={handleSaveRecurEdit}
						>
							Save
						</Button>
					</div>

					<div style={{ marginBottom: "20px" }}>
						<Button
							disabled={editDisabled}
							variant="contained"
							color="error"
							sx={{ mr: 5 }}
							onClick={handleRemoveClick}
						>
							Remove
						</Button>

						<Button variant="outlined" onClick={close}>
							Close
						</Button>
					</div>
					{/* {openErrorModal && (
					<Collapse in={openErrorModal}>
						<Alert severity="error">{errorMessage}</Alert>
					</Collapse>
				)} */}
				</div>
				{openRemove && (
					<RemoveScheduleModal
						openRemove={openRemove}
						removeScheduleId={scheduleId}
						closeRemove={closeRemove}
						canRemove={canRemove}
						dayOfWkIdx={dayIdx}
						handleRemoveSchedule={handleRemoveSchedule}
						openErrorModal={openErrorModal}
						errorMessage={errorMessage}
						isRecur={true}
						destination={destination}
						isPaused={isPaused}
					/>
				)}
			</Box>
		</Modal>
	);
}

export default EditScheduleModal;
