import React, { useState } from "react";
import { Button } from "@mui/material";
import styles from "../../../../styles/components/dashboard/orders/remove-schedule-tab.module.css";
import RemoveScheduleModal from "./RemoveScheduleModal";
import {
	pauseSchedule,
	removeSchedule,
} from "../../../../actions/dashboard/scheduleCrud";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import EditScheduleModal from "./EditScheduleModal";

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
	const [edit, setEdit] = useState({
		openEditModal: false,
		editDisabled: false,
	});

	const { errorMessage, openErrorModal } = removeRes;
	const { openRemoveModal, canRemove, removeScheduleId } = scheduleRemove;
	const { openEditModal, editDisabled } = edit;
	const {
		endTime,
		numAvailable,
		itemPrice,
		itemName,
		recurring,
		dayOfWkIdx,
		id,
		status,
		isPaused,
	} = schedule;

	const handleEdit = () => {
		const currDate = new Date();
		const currEpoch = Date.parse(currDate);

		if (currEpoch < endTime) {
			setEdit((prev) => ({
				...prev,
				openEditModal: true,
				editDisabled: false,
			}));
		} else {
			setEdit((prev) => ({
				...prev,
				openEditModal: true,
				editDisabled: true,
			}));
		}
	};

	const handleCloseEdit = () => {
		setEdit((prev) => ({ ...prev, openEditModal: false }));
	};

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

	const handleCloseRemove = () => {
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
	};

	const handleRemoveSchedule = async (e, removeScheduleId, dayOfWkIdx) => {
		const { success, message } = await removeSchedule(
			bizId,
			removeScheduleId,
			dayOfWkIdx,
			status
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

	const handlePauseSchedule = async (e, removeScheduleId, dayOfWkIdx) => {
		const { success, message } = await pauseSchedule(
			bizId,
			removeScheduleId,
			dayOfWkIdx,
			status
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

	return (
		<div
			className={`${styles.RemoveScheduleTab}`}
			style={
				!isPaused
					? endTime > Date.parse(new Date())
						? numAvailable > 0
							? status === "Flash"
								? keyFlash
								: keyGreen
							: keyGray
						: keyGray
					: keyGray
			}
		>
			<p
				className={`${styles.Status}`}
				style={{
					backgroundColor: !isPaused
						? endTime > Date.parse(new Date())
							? numAvailable > 0
								? status === "Flash"
									? "var(--flash)"
									: "var(--light-green)"
								: "var(--light-red)"
							: "var(--gray)"
						: "var(--gray)",
				}}
			>
				{!isPaused
					? endTime > Date.parse(new Date())
						? numAvailable > 0
							? status === "Flash"
								? "Flash"
								: "Live"
							: "Sold out"
						: "Past"
					: "Pause"}
			</p>
			{/* <p>{itemPrice}</p> */}
			<div className={`${styles.Quantity}`}>
				<p>{numAvailable}x</p>
				<p className={`${styles.ItemName}`}>{itemName}</p>
			</div>
			<p
				style={{
					color: recurring ? "black" : "var(--gray)",
					textDecoration: recurring ? "none" : "line-through",
					// fontWeight: "bold",
				}}
			>
				Recur
			</p>
			{recurring ? (
				<Button
					disabled={numAvailable === 0}
					variant="text"
					color="info"
					onClick={handleEdit}
				>
					edit
				</Button>
			) : (
				<Button variant="text" color="error" onClick={handleRemove}>
					remove
				</Button>
			)}
			{openRemoveModal && (
				<RemoveScheduleModal
					openRemove={openRemoveModal}
					removeScheduleId={removeScheduleId}
					closeRemove={handleCloseRemove}
					canRemove={canRemove}
					dayOfWkIdx={dayOfWkIdx}
					handleRemoveSchedule={handleRemoveSchedule}
					openErrorModal={openErrorModal}
					errorMessage={errorMessage}
					isRecur={false}
					destination
				/>
			)}
			{openEditModal && (
				<EditScheduleModal
					isPaused={isPaused}
					bizId={bizId}
					isOpen={openEditModal}
					close={handleCloseEdit}
					handleRemoveSchedule={handleRemoveSchedule}
					handlePauseSchedule={handlePauseSchedule}
					dayIdx={dayOfWkIdx}
					scheduleId={id}
					editDisabled={editDisabled}
					handleRemove={handleRemove}
					openRemove={openRemoveModal}
					closeRemove={handleCloseRemove}
					canRemove={canRemove}
					openErrorModal={openErrorModal}
					errorMessage={errorMessage}
					destination={"orders"}
					schedule={schedule}
				/>
			)}
		</div>
	);
}

export default RemoveScheduleTab;
