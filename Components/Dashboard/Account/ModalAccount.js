import React, { useState } from "react";
import {
	Button,
	Modal,
	Box,
	Typography,
	CircularProgress,
	Grid,
} from "@mui/material";
import {
	timeOutReauthenticate,
	updateSignInPassword,
} from "../../../actions/auth/auth";
import { updateBizDataUser } from "../../../actions/crud/bizUser";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

function ModalAccount({
	uid,
	bizId,
	handleReauthenticate,
	modalName,
	storedUser,
	closeModal,
	showReauthenticateModal,
	productLoginInfo,
	stopEditProductAndLogin,
}) {
	const [open, setOpen] = useState(false);
	const [handleResponse, setHandleResponse] = useState({
		loading: false,
		message: "",
		success: "",
		isVerified: false,
		showPassword: false,
	});
	const [loginInfo, setLoginInfo] = useState({
		email: "",
		password: "",
	});

	const { email, password } = loginInfo;
	const { loading, message, success, isVerified, showPassword } =
		handleResponse;

	async function handleReauthenticateSubmit(e) {
		e.preventDefault();
		setHandleResponse({ loading: true, message: "" });
		if (!isVerified) {
			const resVerify = await timeOutReauthenticate(password);
			if (resVerify.success) {
				// * Handle new email update
				if (modalName === "email") {
					const oldLoginEmail = storedUser.email;
					const newEmailLowerCase = _.toLower(productLoginInfo.loginEmail);
					let additionalChange;

					if (oldLoginEmail !== productLoginInfo.loginEmail) {
						additionalChange = true;
					}

					const productInfo = {
						loginEmail: newEmailLowerCase,
					};

					const res = await updateBizDataUser(
						uid,
						bizId,
						"form2",
						productInfo,
						additionalChange,
						oldLoginEmail,
						storedUser
					);

					if (res.success) {
						setOpen(true);
						setHandleResponse({
							loading: false,
							success: "Successfully updated.",
							isVerified: false,
						});
					} else {
						setHandleResponse({
							loading: false,
							message: res.message,
						});
					}
				}

				// * If password, set is Verified true, then update modal to new pw input.
				// * New input will trigger outter else statement.
				if (modalName === "password") {
					setHandleResponse({ loading: false, message: "", isVerified: true });
					setLoginInfo((prev) => ({ ...prev, password: "" }));
				}
			} else {
				setOpen(true);
				setHandleResponse({
					loading: false,
					message: resVerify.message,
					isVerified: false,
				});
			}
		} else {
			const resUpdatePassword = await updateSignInPassword(
				password,
				uid,
				bizId
			);
			if (resUpdatePassword.success) {
				setOpen(true);
				setHandleResponse({
					loading: false,
					success: "Password updated successfully.",
				});
			} else {
				setOpen(true);
				setHandleResponse({
					loading: false,
					message: resUpdatePassword.message,
				});
			}
		}
	}

	function handleChangeForm(e) {
		const { name, value } = e.target;
		setLoginInfo((prev) => ({ ...prev, [name]: value }));
	}

	return (
		<React.Fragment>
			<Modal
				open={showReauthenticateModal}
				onClose={() => {
					handleReauthenticate();
					closeModal();
				}}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography id="modal-modal-title" variant="h6" component="h2">
						{isVerified ? "New password" : " Verify your password"}
					</Typography>
					<Box
						component="form"
						onSubmit={handleReauthenticateSubmit}
						sx={{ mt: 1 }}
					>
						<input
							onChange={handleChangeForm}
							name="password"
							type={!showPassword ? "password" : "text"}
							placeholder={isVerified ? "New password" : "Password *"}
							value={password}
							required
							style={{ width: "100%", height: "40px", marginBottom: "20px" }}
						/>

						<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
							<input
								type="checkbox"
								id="show-pw-checkbox"
								onChange={() =>
									setHandleResponse((prev) => ({
										...prev,
										showPassword: !prev.showPassword,
									}))
								}
							/>
							<label htmlFor="show-pw-checkbox">Show password</label>
						</div>
						{message && (
							<Grid item xs={12} md={12} mt={2}>
								<Collapse in={open}>
									<Alert
										severity="error"
										onClose={() => {
											setOpen(false);
										}}
									>
										<AlertTitle>Error</AlertTitle>
										{message}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{success && (
							<Grid item xs={12} md={12} mt={2}>
								<Collapse in={open}>
									<Alert
										severity="success"
										onClose={() => {
											setOpen(false);
										}}
									>
										<AlertTitle>Success</AlertTitle>
										{success}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{loading ? (
							<CircularProgress />
						) : success ? (
							<Button
								type="button"
								onClick={() => {
									setHandleResponse({ isVerified: false });
									handleReauthenticate();
									stopEditProductAndLogin();
									closeModal();
								}}
								fullWidth
								variant="filled"
								sx={{ mt: 3, mb: 2 }}
							>
								Close
							</Button>
						) : (
							<Button
								type="submit"
								fullWidth
								variant="contained"
								sx={{ mt: 3, mb: 2 }}
							>
								{isVerified ? "Change password" : "Verify"}
							</Button>
						)}
					</Box>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default ModalAccount;
