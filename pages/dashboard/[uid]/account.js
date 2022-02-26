import React, { useState, useEffect, useRef } from "react";
import Layout from "../../../Components/Layout";
import { getBiz, updateBizDataUser } from "../../../actions/crud/bizUser";
import {
	timeOutReauthenticate,
	updateSignInPassword,
} from "../../../actions/auth/auth";
import { getLocalStorage } from "../../../actions/auth/auth";
import { Button, Grid } from "@mui/material";
import { useRouter } from "next/router";
import styles from "../../../styles/pages/dashboard/account.module.css";
import ModalAccount from "../../../Components/Dashboard/Account/ModalAccount";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import PhoneInput from "react-phone-input-2";
import CurrencyInput from "react-currency-input-field";

// TODO: Make load client side.

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

function Account() {
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
		itemName: "",
		itemDescription: "",
		loginEmail: "",
		isLoginEmailChange: false,
		originalPrice: "",
		defaultPrice: "",
		allergens: "",
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
	const {
		itemName,
		itemDescription,
		loginEmail,
		isLoginEmailChange,
		originalPrice,
		defaultPrice,
		allergens,
	} = productLoginInfo;
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
		let bizIdTemp;
		if (storedUserInfo) {
			const bizOwned = storedUserInfo.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ storedUser: storedUserInfo, bizId: bizIdTemp });
		}

		if (!bizIdTemp) {
			return;
		}

		loadBizData(bizIdTemp);
	}, []);

	// * UseEffect Actions ------------------------------------------------------

	async function loadBizData(bizId) {
		setHandling({ loading: true, message: "", data: {} });
		const resBizData = await getBiz(bizId);

		if (resBizData.success) {
			const bizData = resBizData.docData;
			setProductLoginInfo({
				itemName: bizData.itemName,
				itemDescription: bizData.itemDescription,
				loginEmail: bizData.login.email,
				originalPrice: bizData.originalPrice.slice(1),
				defaultPrice: bizData.defaultPrice.slice(1),
				allergens: bizData.allergens,
			});
			setBusinessInfo({
				bizName: bizData.name,
				bizPhoneNumber: "1" + bizData.storeContact.phoneNumber,
				website: bizData.website,
				address_1: bizData.address.address_1,
				address_2: bizData.address.address_2,
				city: bizData.address.city,
				state: bizData.address.state,
				zip: bizData.address.zip,
			});
			setPersonalInfo({
				firstName: bizData.ownerContact.firstName,
				lastName: bizData.ownerContact.lastName,
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
				console.log(personalRef.current);
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
			// Check allergy format.
			const allergenArray = allergens.split(" ");
			let commaCount = 0;
			let wordCount = 0;

			for (let i = 0; i < allergenArray.length; i++) {
				const curr = allergenArray[i];

				if (i === allergenArray.length - 1) {
					if (curr[curr.length - 1] !== ".") {
						setHandling({
							messageProduct:
								"Looks like you're missing a period in your allergens description.",
						});
						setOpenProduct(true);
						productRef.current.scrollIntoView();
						return;
					}
				} else if (i === allergenArray.length - 2) {
					if (curr[curr.length - 1] === "," || curr[curr.length - 1] === ".") {
						setHandling({
							messageProduct:
								"Plese check your allergens description to match this format. Ex: Milk, nuts, soybean, and wheat.",
						});
						setOpenProduct(true);
						productRef.current.scrollIntoView();
						return;
					}
					wordCount += 1;
				} else {
					if (curr[curr.length - 1] === ",") {
						commaCount += 1;
						wordCount += 1;
					} else {
						wordCount += 1;
					}
				}
			}

			if (allergenArray.length === 3) {
				if (commaCount + 2 !== wordCount) {
					setHandling({
						messageProduct:
							"Please type your allergens with the correct commas under Product details. Ex: Milk, nuts, soybean, and wheat.",
					});
					setOpenProduct(true);
					productRef.current.scrollIntoView();
					return;
				}
			} else if (allergenArray.length === 1) {
				if (commaCount !== wordCount) {
					if (commaCount + 1 !== wordCount) {
						setHandling({
							messageProduct:
								"Please type your allergens with the correct commas under Product details. Ex: Milk, nuts, soybean, and wheat.",
						});
						setIsOpen(true);
						return;
					}
				}
			} else {
				if (commaCount + 1 !== wordCount) {
					setHandling({
						messageProduct:
							"Plese check your allergens description to match this format. Ex: Milk, nuts, soybean, and wheat.",
					});
					setOpenProduct(true);
					productRef.current.scrollIntoView();
					return;
				}
			}
			const oldEmail = storedUser.email;

			// * Update login info & product info in modal
			if (oldEmail !== loginEmail) {
				if (!isReAuthenticated) {
					setShowReauthenticateModal(true);
					setModalName("email");
					return;
				}
			}

			const productLogin = {
				itemName,
				itemDescription,
				loginEmail,
				isLoginEmailChange,
				originalPrice: "$" + originalPrice,
				defaultPrice: "$" + defaultPrice,
				allergens,
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

		if (name === "form3") {
			const oldBizName = storedUser.bizOwned[bizId].name;
			const fullAddress =
				address_1 +
				" " +
				(address_2 !== "" ? address_2 + ", " : "") +
				(city !== "" ? city + ", " : "") +
				state +
				" " +
				zip;

			if (bizPhoneNumber.length !== 11) {
				setHandling({
					loading: false,
					messageBiz: `Phone numbers must include +1 area code and have a length of 11.`,
				});
				setOpenBiz(true);
				bizRef.current.scrollIntoView();
				return;
			}

			if (bizPhoneNumber[0] !== "1") {
				setHandling({
					loading: false,
					messageBiz: `Phone numbers must include +1 area code. We currently only provide service in the United States.`,
				});
				setOpenBiz(true);
				bizRef.current.scrollIntoView();
				return;
			}

			const newPhoneNoSpaceChar = bizPhoneNumber.slice(1);

			const bizData = {
				address: {
					fullAddress,
					address_1,
					address_2,
					city,
					state,
					zip,
				},
				bizName,
				bizPhoneNumber: newPhoneNoSpaceChar,
				website,
			};

			if (oldBizName !== bizName) {
				additionalChange = true;
			}

			const res = await updateBizDataUser(
				uid,
				bizId,
				name,
				bizData,
				additionalChange,
				null,
				storedUser
			);

			if (res.success) {
				setHandling({
					loading: false,
					successBiz: "Successfully updated.",
				});
				setIsEditBizInfo(false);
				setOpenBiz(true);
				bizRef.current.scrollIntoView();
			} else {
				setHandling({ loading: false, messageBiz: res.message });
				bizRef.current.scrollIntoView();
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

	return (
		<Layout uid={uid} currentPage="Account">
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
							<Grid item xs={12} md={12} mt={2}>
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
							<Grid item xs={12} md={12} mt={2}>
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
										loadBizData(bizId);
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
							<Grid item xs={12} md={12} mt={2}>
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
							<Grid item xs={12} md={12} mt={2}>
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
						<div className={`${styles.Account__FlexLR}`}>
							<div className={`${styles.Account__FlexLeft}`}>
								<h3>Product info</h3>
								<div className={`${styles.Account__FlexColumn}`}>
									<div>
										<label htmlFor="itemName">Product name</label>
										<input
											disabled={!isEditProductLoginInfo}
											required
											id="itemName"
											name="itemName"
											type="text"
											value={itemName}
											onChange={handleChangeproductLoginInfo}
										/>
									</div>

									<div>
										<label htmlFor="itemDescription">Product description</label>
										<textarea
											disabled={!isEditProductLoginInfo}
											required
											id="itemDescription"
											name="itemDescription"
											rows={4}
											onChange={handleChangeproductLoginInfo}
											value={itemDescription}
											style={{ paddingTop: "5px" }}
										/>
									</div>
									<div>
										<label htmlFor="allergens">
											Allergens <br /> Please type in this format.
											<br /> *Milk, nuts, and wheat.
											<br /> *Milk and nuts.
											<br /> *Milk.
											<br /> *None.
										</label>
										<textarea
											disabled={!isEditProductLoginInfo}
											required
											id="allergens"
											name="allergens"
											rows={2}
											onChange={handleChangeproductLoginInfo}
											value={allergens}
											style={{ paddingTop: "5px" }}
										/>
									</div>
									<div>
										<label htmlFor="originalPrice">Original price</label>
										<CurrencyInput
											disabled={!isEditProductLoginInfo}
											id="originalPrice"
											name="originalPrice"
											value={originalPrice}
											prefix="$"
											required
											decimalScale={2}
											decimalsLimit={2}
											onValueChange={(value, name) => {
												setProductLoginInfo((prev) => ({
													...prev,
													[name]: value,
												}));
											}}
										/>
									</div>
									<div>
										<label htmlFor="itemPrice">Item price</label>
										<CurrencyInput
											disabled={!isEditProductLoginInfo}
											id="defaultPrice"
											name="defaultPrice"
											placeholder="Item price - $2.00 minimum"
											value={defaultPrice}
											prefix="$"
											required
											decimalScale={2}
											decimalsLimit={2}
											onValueChange={(value, name) =>
												setProductLoginInfo((prev) => ({
													...prev,
													[name]: value,
												}))
											}
										/>
									</div>
								</div>
							</div>
							<div className={`${styles.Account__FlexRight}`}>
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
									Change password
								</Button>
							</div>
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
										loadBizData(bizId);
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
				<form onSubmit={handleSubmit} name="form3">
					<div className={`${styles.InfoContainer}`} ref={bizRef}>
						{messageBiz && (
							<Grid item xs={12} md={12} mt={2}>
								<Collapse in={openBiz}>
									<Alert
										severity="error"
										onClose={() => {
											setOpenBiz(false);
										}}
									>
										<AlertTitle>Error</AlertTitle>
										{messageBiz}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{successBiz && (
							<Grid item xs={12} md={12} mt={2}>
								<Collapse in={openBiz}>
									<Alert
										severity="success"
										onClose={() => {
											setOpenBiz(false);
										}}
									>
										<AlertTitle>Success</AlertTitle>
										{successBiz}
									</Alert>
								</Collapse>
							</Grid>
						)}
						<h3>Business info</h3>
						<div className={`${styles.Account__FlexColumn}`}>
							<div className={`${styles.Account__FlexLR}`}>
								<div className={`${styles.Account__FlexLeft}`}>
									<label htmlFor="bizName">Business name</label>
									<input
										disabled={!isEditBizInfo}
										required
										id="bizName"
										name="bizName"
										type="text"
										value={bizName}
										onChange={handleChangeBizInfo}
									/>
								</div>

								<div className={`${styles.Account__FlexRight}`}>
									<label htmlFor="bizPhoneNumber">Business phone</label>
									<PhoneInput
										disabled={!isEditBizInfo}
										required
										country="us"
										id="bizPhoneNumber"
										name="bizPhoneNumber"
										type="tel"
										value={bizPhoneNumber}
										specialLabel=""
										onChange={(e) => handleChangeBizInfo(e, "bizPhoneNumber")}
									/>
								</div>
							</div>
							<div>
								<label htmlFor="website">Website</label>
								<input
									disabled={!isEditBizInfo}
									required
									id="website"
									name="website"
									type="url"
									value={website}
									onChange={handleChangeBizInfo}
								/>
							</div>
							<div>
								<label htmlFor="address_1">Address line 1</label>
								<input
									disabled={!isEditBizInfo}
									required
									id="address_1"
									name="address_1"
									type="text"
									value={address_1}
									onChange={handleChangeBizInfo}
								/>
							</div>
							<div>
								<label htmlFor="address_2">Address line 2</label>

								<input
									disabled={!isEditBizInfo}
									id="address_2"
									name="address_2"
									type="text"
									value={address_2}
									onChange={handleChangeBizInfo}
								/>
							</div>
							<div className={`${styles.Business__bot}`}>
								<div>
									<label htmlFor="city">City</label>
									<input
										disabled={!isEditBizInfo}
										required
										id="city"
										name="city"
										type="text"
										value={city}
										onChange={handleChangeBizInfo}
									/>
								</div>
								<div>
									<label htmlFor="state">State</label>
									<input
										disabled={!isEditBizInfo}
										required
										id="state"
										name="state"
										type="text"
										value={state}
										onChange={handleChangeBizInfo}
									/>
								</div>
								<div>
									<label htmlFor="zip">Zip</label>
									<input
										disabled={!isEditBizInfo}
										required
										id="zip"
										name="zip"
										type="number"
										value={zip}
										onChange={handleChangeBizInfo}
										className={styles.Account__noArrows}
									/>
								</div>
							</div>
						</div>
						{isEditBizInfo ? (
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
										loadBizData(bizId);
										setIsEditBizInfo(false);
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
								onClick={() => setIsEditBizInfo(true)}
							>
								Edit
							</Button>
						)}
					</div>
				</form>
				<div className={`${styles.InfoContainer}`}>
					<div className={`${styles.Account__FlexLeft}`}>
						<h3>Invite code</h3>
						<div
							className={`${styles.Account__FlexColumn}`}
							style={{ marginBottom: "0px" }}
						>
							<input
								disabled={!isEditProductLoginInfo}
								required
								id="inviteCode"
								name="inviteCode"
								type="text"
								value={storedUser.inviteCode}
								onChange={handleChangeproductLoginInfo}
							/>
							<p>
								* Your invite code will change if you change your first name.
							</p>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default Account;
