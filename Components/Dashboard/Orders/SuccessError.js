import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Button, Grid } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	width: "fit-content",
	transform: "translate(-50%, -50%)",
	p: 4,
};

function SuccessError({ handleOrderUpdate, setHandleOrderUpdates }) {
	const { errorMessage, successMessage, isOpen } = handleOrderUpdate;
	console.log(handleOrderUpdate);

	useEffect(() => {
		setTimeout(() => {
			setHandleOrderUpdates({ isOpen: false });
		}, 2000);
	}, [setHandleOrderUpdates]);

	if (errorMessage) {
		return (
			<div>
				<Modal
					open={isOpen}
					onClose={() => setHandleOrderUpdates({ isOpen: false })}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={style}>
						<Grid item xs={12} md={12} sx={{ border: "2px solid #000" }}>
							<Collapse in={isOpen}>
								<Alert
									severity="error"
									onClose={() => {
										setHandleOrderUpdates({ isOpen: false });
									}}
								>
									{errorMessage}
								</Alert>
							</Collapse>
						</Grid>
					</Box>
				</Modal>
			</div>
		);
	}

	if (successMessage) {
		return (
			<div>
				<Modal
					open={isOpen}
					onClose={() => setHandleOrderUpdates({ isOpen: false })}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box sx={style}>
						<Grid item xs={12} md={12} sx={{ border: "2px solid #000" }}>
							<Collapse in={isOpen}>
								<Alert
									severity="success"
									onClose={() => {
										setHandleOrderUpdates({ isOpen: false });
									}}
								>
									{successMessage}
								</Alert>
							</Collapse>
						</Grid>
					</Box>
				</Modal>
			</div>
		);
	}
}

export default SuccessError;
