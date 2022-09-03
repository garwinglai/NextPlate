import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Image from "next/image";
import MyLoader from "../../helper/MyLoader";
import styles from "../../styles/components/misc/enablesound.module.css";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	width: "100%",
	transform: "translate(-50%, -50%)",
	bgcolor: "var(--hover-green)",
	border: "2px solid var(--dark-green)",
	boxShadow: 24,
	p: 4,
	// borderRadius: "5px",
};

function EnableSound({ isAudioEnabled, closeEnableSoundModal }) {
	return (
		<Modal
			open={!isAudioEnabled}
			// onClose={closeEnableSoundModal}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
			className={`${styles.enableSoundModal}`}
		>
			<Box sx={style} className={`${styles.mainContainer}`}>
				<div className={`${styles.textContainer}`}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						Enable Sound
					</Typography>
					<Image
						loader={MyLoader}
						src="https://img.icons8.com/ios-filled/50/000000/room-sound.png"
						width="25px"
						height="25px"
						alt="sound icon"
					/>
				</div>
				<Button
					variant="contained"
					size="large"
					fullWidth
					onClick={closeEnableSoundModal}
				>
					Enable
				</Button>
			</Box>
		</Modal>
	);
}

export default EnableSound;
