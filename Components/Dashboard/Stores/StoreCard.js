import React, { useState, useRef, useEffect } from "react";
import styles from "../../../styles/components/dashboard/stores/storecard.module.css";
import PhoneInput from "react-phone-input-2";
import { Button, Grid } from "@mui/material";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { updateBizDataUser } from "../../../actions/crud/bizUser";
import { getLocalStorage } from "../../../actions/auth/auth";
import { useRouter } from "next/router";

function StoreCard({ biz, bizId }) {
	const bizRef = useRef(null);

	const { address, storeContact, userInfo } = biz;

	const [storedUser, setStoredUser] = useState({});

	const [bizInfo, setBizInfo] = useState({
		isEditBizInfo: false,
		bizName: biz.name,
		address_1: address.address_1,
		address_2: address.address_2,
		city: address.city,
		country: address.country,
		state: address.state,
		zip: address.zip,
		website: biz.website,
		bizPhoneNumber: `1${storeContact.phoneNumber}`,
	});

	const [message, setMessage] = useState({
		loading: false,
		errMsg: "",
		openErrModal: false,
		successMsg: "",
		openSuccessModal: false,
	});

	const {
		isEditBizInfo,
		bizName,
		address_1,
		address_2,
		city,
		country,
		state,
		zip,
		website,
		bizPhoneNumber,
	} = bizInfo;
	const { loading, errMsg, openErrModal, successMsg, openSuccessModal } =
		message;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUserInfo = JSON.parse(getLocalStorage("user"));
		if (storedUserInfo) {
			setStoredUser(storedUserInfo);
		}
	}, []);

	const handleChangeInfo = (e, bName) => {
		if (bName === "bizPhoneNumber") {
			const name = bName;
			const value = e;

			setBizInfo((prev) => ({ ...prev, [name]: value }));
		} else {
			const { name, value } = e.target;
			setBizInfo((prev) => ({ ...prev, [name]: value }));
		}
	};

	const handleEditClick = (e) => {
		const { name } = e.target;
		if (name === "edit") {
			setBizInfo((prev) => ({ ...prev, isEditBizInfo: true }));
		} else {
			setBizInfo((prev) => ({
				...prev,
				isEditBizInfo: false,
				bizName: biz.name,
				address_1: address.address_1,
				address_2: address.address_2,
				city: address.city,
				country: address.country,
				state: address.state,
				zip: address.zip,
				website: biz.website,
				bizPhoneNumber: `1${storeContact.phoneNumber}`,
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		console.log("submit");
		setMessage((prev) => ({ ...prev, loading: true }));

		if (bizPhoneNumber.length !== 11) {
			setMessage({
				loading: false,
				errMsg: `Phone numbers must include +1 area code and have a length of 11.`,
				openErrModal: true,
			});

			bizRef.current.scrollIntoView();
			return;
		}

		if (bizPhoneNumber[0] !== "1") {
			setMessage({
				loading: false,
				errMsg: `Phone numbers must include +1 area code. We currently only provide service in the United States.`,
				openErrModal: true,
			});

			bizRef.current.scrollIntoView();
			return;
		}

		if (state.length > 2) {
			setMessage({
				loading: false,
				errMsg: `Please enter a valid state abbreviation.`,
				openErrModal: true,
			});

			bizRef.current.scrollIntoView();
			return;
		}

		let additionalChange = false;
		const name = "form3";
		const oldBizName = biz.name;
		const newPhoneNoSpaceChar = bizPhoneNumber.slice(1);
		const fullAddress =
			address_1 +
			" " +
			(address_2 !== "" ? address_2 + ", " : "") +
			(city !== "" ? city + ", " : "") +
			state +
			" " +
			zip;

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

		setMessage((prev) => ({ ...prev, loading: false }));
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
			setMessage({
				loading: false,
				successMsg: "Successfully updated.",
				openSuccessModal: true,
			});
			setBizInfo((prev) => ({ ...prev, isEditBizInfo: false }));

			bizRef.current.scrollIntoView();
		} else {
			setMessage({
				loading: false,
				errMsg: res.message,
				openErrModal: true,
			});

			bizRef.current.scrollIntoView();
		}
	};

	return (
		<div className={`${styles.StoreCard}`}>
			<form onSubmit={handleSubmit} name="form3">
				<div className={`${styles.InfoContainer}`} ref={bizRef}>
					{errMsg && (
						<Grid item xs={12} md={12} mt={2} mb={2}>
							<Collapse in={openErrModal}>
								<Alert
									severity="error"
									onClose={() => {
										setMessage((prev) => ({ ...prev, openErrModal: false }));
									}}
								>
									<AlertTitle>Error</AlertTitle>
									{errMsg}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{successMsg && (
						<Grid item xs={12} md={12} mt={2} mb={2}>
							<Collapse in={openSuccessModal}>
								<Alert
									severity="success"
									onClose={() => {
										setMessage((prev) => ({
											...prev,
											openSuccessModal: false,
										}));
									}}
								>
									<AlertTitle>Success</AlertTitle>
									{successMsg}
								</Alert>
							</Collapse>
						</Grid>
					)}
					<h3>{bizName}</h3>
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
									onChange={handleChangeInfo}
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
									onChange={(e) => handleChangeInfo(e, "bizPhoneNumber")}
								/>
							</div>
						</div>
						<div>
							<label htmlFor="website">Website</label>
							<input
								disabled={!isEditBizInfo}
								id="website"
								name="website"
								type="url"
								value={website}
								onChange={handleChangeInfo}
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
								onChange={handleChangeInfo}
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
								onChange={handleChangeInfo}
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
									onChange={handleChangeInfo}
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
									onChange={handleChangeInfo}
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
									onChange={handleChangeInfo}
									className={styles.Account__noArrows}
								/>
							</div>
						</div>
					</div>
					{isEditBizInfo ? (
						<>
							{loading ? (
								<CircularProgress />
							) : (
								<Button
									variant="contained"
									sx={{ width: "auto" }}
									size="small"
									type="submit"
								>
									Save changes
								</Button>
							)}
							<Button
								variant="outlined"
								sx={{ width: "auto", marginLeft: "20px" }}
								size="small"
								type="submit"
								color="error"
								name="cancel"
								onClick={handleEditClick}
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
							name="edit"
							onClick={handleEditClick}
						>
							Edit
						</Button>
					)}
				</div>
			</form>
		</div>
	);
}

export default StoreCard;
