import React, { useState, useEffect, useRef } from "react";
import Layout from "../../../Components/Layout";
import {
	getBizUserNew,
	updateBizDataUser,
} from "../../../actions/crud/bizUser";
import { getLocalStorage } from "../../../actions/auth/auth";
import { Button, Grid } from "@mui/material";
import { useRouter } from "next/router";
import styles from "../../../styles/pages/dashboard/settings.module.css";
import ModalAccount from "../../../Components/Dashboard/Account/ModalAccount";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import PhoneInput from "react-phone-input-2";
import _ from "lodash";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { IconButton } from "@mui/material";
import { signOutUser } from "../../../actions/auth/auth";

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

function Settings() {
	const [openPersonal, setOpenPersonal] = useState(false);
	const [openBiz, setOpenBiz] = useState(false);
	const [openProduct, setOpenProduct] = useState(false);

	const [modalName, setModalName] = useState("");

	const [isReAuthenticated, setIsReAuthenticated] = useState(false);
	const [showReauthenticateModal, setShowReauthenticateModal] = useState(false);

	const [isEditProductLoginInfo, setisEditProductLoginInfo] = useState(false);
	const [isEditBizInfo, setIsEditBizInfo] = useState(false);
	const [isEditPersonalInfo, setIsEditPersonalInfo] = useState(false);
	const [handling, setHandling] = useState({
		loading: false,
		messageProduct: "",
		messageBiz: "",
		messagePersonal: "",
		successProduct: "",
		successBiz: "",
		successPersonal: "",
		data: {},
	});
	const [productLoginInfo, setProductLoginInfo] = useState({
		loginEmail: "",
		isLoginEmailChange: false,
	});
	const [businessInfo, setBusinessInfo] = useState({
		bizName: "",
		bizPhoneNumber: "",
		website: "",
		address_1: "",
		address_2: "",
		city: "",
		state: "",
		zip: "",
	});
	const [personalInfo, setPersonalInfo] = useState({
		firstName: "",
		lastName: "",
		ownerPhoneNumber: "",
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});

	const { storedUser, bizId } = user;
	const {
		loading,
		messageProduct,
		messageBiz,
		messagePersonal,
		successProduct,
		successBiz,
		successPersonal,
		data,
	} = handling;
	const { firstName, lastName, ownerPhoneNumber } = personalInfo;
	const { loginEmail, isLoginEmailChange } = productLoginInfo;
	const {
		bizName,
		bizPhoneNumber,
		website,
		address_1,
		address_2,
		city,
		state,
		zip,
	} = businessInfo;

	const personalRef = useRef(null);
	const productRef = useRef(null);
	const bizRef = useRef(null);

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUserInfo = JSON.parse(getLocalStorage("user"));
		const userId = JSON.parse(getLocalStorage("uid"));
		const bizOwned = storedUserInfo.bizOwned;
		const numBizOwned = Object.keys(bizOwned).length;

		let bizIdArr = [];

		if (storedUserInfo) {
			if (numBizOwned > 1) {
				bizIdArr = Object.keys(bizOwned);

				setUser({ storedUser: storedUserInfo, bizId: bizIdArr });
			} else {
				const localStorageBizId = Object.keys(bizOwned).pop();
				bizIdArr.push(localStorageBizId);

				setUser({ storedUser: storedUserInfo, bizId: bizIdArr });
			}
		}

		loadBizData(userId);
	}, []);

	// * UseEffect Actions ------------------------------------------------------

	async function loadBizData(uid) {
		setHandling({ loading: true, message: "", data: {} });
		const resBizData = await getBizUserNew(uid);

		if (resBizData.success) {
			const bizData = resBizData.userData;
			setProductLoginInfo({
				loginEmail: bizData.login.email,
			});
			setPersonalInfo({
				firstName: bizData.firstName,
				lastName: bizData.lastName,
				ownerPhoneNumber: "1" + bizData.ownerContact.phoneNumber,
			});
			setHandling((prev) => ({
				loading: false,
				message: "",
			}));
		} else {
			setHandling((prev) => ({ loading: false, message: resBizData.message }));
		}
	}

	// * Form Actions ------------------------------------------------------

	async function handleSubmit(e) {
		e.preventDefault();
		setHandling({ loading: true });
		const { name } = e.target;

		let additionalChange = false;

		if (name == "form1") {
			const oldFName = storedUser.firstName;

			if (oldFName !== firstName) {
				additionalChange = true;
			}

			if (ownerPhoneNumber.length !== 11) {
				setHandling({
					loading: false,
					messagePersonal: `Phone numbers must include +1 area code and have a length of 11.`,
				});
				setOpenPersonal(true);
				personalRef.current.scrollIntoView();
				return;
			}

			if (ownerPhoneNumber[0] !== "1") {
				setHandling({
					loading: false,
					messagePersonal: `Phone numbers must include +1 area code. We currently only provide service in the United States.`,
				});
				setOpenPersonal(true);
				personalRef.current.scrollIntoView();
				return;
			}

			const newPhoneNoSpaceChar = ownerPhoneNumber.slice(1);

			const udpatedPersonalInfo = {
				firstName,
				lastName,
				ownerPhoneNumber: newPhoneNoSpaceChar,
			};

			const res = await updateBizDataUser(
				uid,
				bizId,
				name,
				udpatedPersonalInfo,
				additionalChange,
				null,
				storedUser
			);

			if (res.success) {
				setHandling({
					loading: false,
					successPersonal: "Successfully updated.",
				});
				setIsEditPersonalInfo(false);
				setOpenPersonal(true);
				personalRef.current.scrollIntoView();
			} else {
				setHandling({ loading: false, messagePersonal: res.message });
				personalRef.current.scrollIntoView();
			}
		}

		if (name === "form2") {
			const oldEmail = storedUser.login.email;
			const newEmailLowerCase = _.toLower(loginEmail);
			console.log("form2 diff email", oldEmail, loginEmail);
			// * Update login info & product info in modal
			if (oldEmail !== loginEmail) {
				if (!isReAuthenticated) {
					setShowReauthenticateModal(true);
					setModalName("email");
					return;
				}
			}
			console.log("oldEmail Same", oldEmail, loginEmail);
			const productLogin = {
				loginEmail: newEmailLowerCase,
				isLoginEmailChange,
			};

			const res = await updateBizDataUser(
				uid,
				bizId,
				"form2",
				productLogin,
				additionalChange,
				null,
				storedUser
			);

			if (res.success) {
				setHandling({
					loading: false,
					successProduct: "Successfully updated.",
				});
				setisEditProductLoginInfo(false);
				setOpenProduct(true);
				productRef.current.scrollIntoView();
			} else {
				setHandling({ loading: false, messageProduct: res.message });
				productRef.current.scrollIntoView();
			}
		}
	}

	function handleChangeproductLoginInfo(e) {
		const { name, value } = e.target;
		setProductLoginInfo((prev) => ({ ...prev, [name]: value }));
	}

	function handleChangeBizInfo(e, val) {
		if (val === "bizPhoneNumber") {
			const name = val;
			const value = e;

			setBusinessInfo((prev) => ({ ...prev, [name]: value }));
		} else {
			const { name, value } = e.target;
			setBusinessInfo((prev) => ({ ...prev, [name]: value }));
		}
	}

	function handleChangePersonalInfo(e, val) {
		if (val === "ownerPhoneNumber") {
			const name = val;
			const value = e;

			setPersonalInfo((prev) => ({ ...prev, [name]: value }));
		} else {
			const { name, value } = e.target;
			setPersonalInfo((prev) => ({ ...prev, [name]: value }));
		}
	}

	function handleChangePassword(e) {
		setShowReauthenticateModal(true);
		setModalName("password");
	}

	function handleReauthenticate() {
		setIsReAuthenticated(false);
	}

	function closeModal() {
		setShowReauthenticateModal(false);
	}

	function stopEditProductAndLogin() {
		[setisEditProductLoginInfo(false)];
	}

	async function handleLogOutClick() {
		const { success, message } = await signOutUser();
		if (success) {
			router.push("/business/signin");
		}
	}

	return (
		<Layout uid={uid} currentPage="Settings">
			{showReauthenticateModal && (
				<ModalAccount
					uid={uid}
					bizId={bizId}
					handleReauthenticate={handleReauthenticate}
					modalName={modalName}
					storedUser={storedUser}
					closeModal={closeModal}
					showReauthenticateModal={showReauthenticateModal}
					productLoginInfo={productLoginInfo}
					stopEditProductAndLogin={stopEditProductAndLogin}
				/>
			)}
			<div className={`${styles.Account}`}>
				<form onSubmit={handleSubmit} name="form1">
					<div className={`${styles.InfoContainer}`} ref={personalRef}>
						{messagePersonal && (
							<Grid item xs={12} md={12} mt={2} mb={2}>
								<Collapse in={openPersonal}>
									<Alert
										severity="error"
										onClose={() => {
											setOpenPersonal(false);
										}}
									>
										<AlertTitle>Error</AlertTitle>
										{messagePersonal}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{successPersonal && (
							<Grid item xs={12} md={12} mt={2} mb={2}>
								<Collapse in={openPersonal}>
									<Alert
										severity="success"
										onClose={() => {
											setOpenPersonal(false);
										}}
									>
										<AlertTitle>Success</AlertTitle>
										{successPersonal}
									</Alert>
								</Collapse>
							</Grid>
						)}
						<h3>Personal info</h3>
						<div className={`${styles.Account__FlexLR}`}>
							<div className={`${styles.Account__FlexLeft}`}>
								<div className={`${styles.Account__FlexColumn}`}>
									<div>
										<label htmlFor="firstName">First name</label>
										<input
											disabled={!isEditPersonalInfo}
											required
											id="firstName"
											name="firstName"
											type="text"
											value={firstName}
											onChange={handleChangePersonalInfo}
										/>
									</div>
									<div>
										<label htmlFor="lastName">Last name</label>
										<input
											disabled={!isEditPersonalInfo}
											required
											id="lastName"
											name="lastName"
											type="text"
											value={lastName}
											onChange={handleChangePersonalInfo}
										/>
									</div>
								</div>
							</div>
							<div className={`${styles.Account__FlexRight}`}>
								<div>
									<label htmlFor="ownerPhoneNumber">Owner phone</label>
									<PhoneInput
										disabled={!isEditPersonalInfo}
										required
										country="us"
										id="ownerPhoneNumber"
										name="ownerPhoneNumber"
										type="tel"
										value={ownerPhoneNumber}
										specialLabel=""
										onChange={(e) =>
											handleChangePersonalInfo(e, "ownerPhoneNumber")
										}
									/>
								</div>
							</div>
						</div>
						{isEditPersonalInfo ? (
							<>
								<Button
									variant="contained"
									sx={{ width: "auto" }}
									size="small"
									type="submit"
								>
									Save changes
								</Button>
								<Button
									variant="outlined"
									sx={{ width: "auto", marginLeft: "20px" }}
									size="small"
									type="submit"
									color="error"
									onClick={() => {
										loadBizData(uid);
										setIsEditPersonalInfo(false);
									}}
								>
									Cancel
								</Button>
							</>
						) : (
							<Button
								variant="outlined"
								sx={{ width: "auto" }}
								size="small"
								type="button"
								onClick={() => setIsEditPersonalInfo(true)}
							>
								Edit
							</Button>
						)}
					</div>
				</form>
				<form onSubmit={handleSubmit} name="form2">
					<div className={`${styles.InfoContainer}`} ref={productRef}>
						{messageProduct && (
							<Grid item xs={12} md={12} mt={2} mb={2}>
								<Collapse in={openProduct}>
									<Alert
										severity="error"
										onClose={() => {
											setOpenProduct(false);
										}}
									>
										<AlertTitle>Error</AlertTitle>
										{messageProduct}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{successProduct && (
							<Grid item xs={12} md={12} mt={2} mb={2}>
								<Collapse in={openProduct}>
									<Alert
										severity="success"
										onClose={() => {
											setOpenProduct(false);
										}}
									>
										<AlertTitle>Success</AlertTitle>
										{successProduct}
									</Alert>
								</Collapse>
							</Grid>
						)}

						<div>
							<h3>Login info</h3>
							<div>
								<label htmlFor="loginEmail">Login email</label>
								<input
									disabled={!isEditProductLoginInfo}
									required
									id="loginEmail"
									name="loginEmail"
									type="text"
									value={loginEmail}
									onChange={handleChangeproductLoginInfo}
								/>
							</div>
							<Button
								type="button"
								size="small"
								sx={{ marginTop: "20px" }}
								onClick={handleChangePassword}
							>
								change password
							</Button>
						</div>

						{isEditProductLoginInfo ? (
							<>
								<Button
									variant="contained"
									sx={{ width: "auto" }}
									size="small"
									type="submit"
								>
									Save changes
								</Button>
								<Button
									variant="outlined"
									sx={{ width: "auto", marginLeft: "20px" }}
									size="small"
									type="submit"
									color="error"
									onClick={() => {
										loadBizData(uid);
										setisEditProductLoginInfo(false);
									}}
								>
									Cancel
								</Button>
							</>
						) : (
							<Button
								variant="outlined"
								sx={{ width: "auto" }}
								size="small"
								type="button"
								onClick={() => setisEditProductLoginInfo(true)}
							>
								Edit
							</Button>
						)}
					</div>
				</form>
				<div className={styles.Logout_Container}>
					<IconButton sx={{ fontSize: 14 }} onClick={handleLogOutClick}>
						<PowerSettingsNewIcon sx={{ color: "var(--red)" }} />
						<p className={styles.DashMenu_Logout}>Logout</p>
					</IconButton>
				</div>
			</div>
		</Layout>
	);
}

export default Settings;
