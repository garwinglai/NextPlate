import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import {
	getBiz,
	addBizTextNumbers,
	updateBizTextNumbers,
} from "../../../actions/crud/bizUser";
import { getLocalStorage } from "../../../actions/auth/auth";
import { useRouter } from "next/router";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import {
	Button,
	Grid,
	FormGroup,
	FormControlLabel,
	Checkbox,
	Modal,
	Box,
	Typography,
	TextField,
} from "@mui/material";
import styles from "../../../styles/pages/dashboard/text-settings.module.css";
import PermPhoneMsgRoundedIcon from "@mui/icons-material/PermPhoneMsgRounded";
import PhoneInput from "react-phone-input-2";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "1px solid var(--btn-blue)",
	boxShadow: 24,
	p: 4,
	display: "flex",
	flexDirection: "column",
	gap: "10px",
};

function Text() {
	const [isSaveAlertOpen, setIsSaveAlertOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const [isEdit, setIsEdit] = useState(false);
	const [newNumber, setNewNumber] = useState({ name: "", number: "" });
	const [settingValues, setSettingValues] = useState([
		{
			number: "",
			name: "",
			isSelected: false,
		},
	]);
	const [handleResponse, setHandleResponse] = useState({
		pageLoading: false,
		updateLoading: false,
		saveLoading: false,
		saveSuccessMessage: "",
		saveErrorMessage: "",
		errorMessage: "",
		successMessage: "",
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});

	const { name, number } = newNumber;
	const {
		pageLoading,
		updateLoading,
		saveLoading,
		saveSuccessMessage,
		saveErrorMessage,
		errorMessage,
		successMessage,
	} = handleResponse;
	const { storedUser, bizId } = user;

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
	}, [uid]);

	async function loadBizData(bizId) {
		setHandleResponse({
			pageLoading: true,
			errorMessage: "",
			successMessage: "",
		});
		const resBizData = await getBiz(bizId);

		if (resBizData.success) {
			const bizData = resBizData.docData;
			const textNumObj = bizData.textNumbers;

			const textArray = [];

			for (let key in textNumObj) {
				let keyArray = key.split("");
				let displayNumArray = [];

				for (let i = 0; i < keyArray.length; i++) {
					const curr = keyArray[i];
					if (i === 0) {
						displayNumArray.push(`(`, curr);
					} else if (i === 2) {
						displayNumArray.push(curr, `)`, ` `);
					} else if (i === 5) {
						displayNumArray.push(curr, ` `);
					} else {
						displayNumArray.push(curr);
					}
				}

				let displayNum = displayNumArray.join("");

				textNumObj[key].number = displayNum;

				// let curr = textNumObj[key];
				// curr.number = curr.number.split("")
				textArray.push(textNumObj[key]);
			}

			const sortedBySelectedTextArray = textArray.sort(
				(a, b) => b.name - a.name
			);

			setSettingValues(sortedBySelectedTextArray);
			setHandleResponse({
				pageLoading: false,
			});
		} else {
			setHandleResponse({
				pageLoading: false,
				errorMessage: resBizData.message,
			});
		}
	}

	async function handleAddNumber(e) {
		e.preventDefault();
		setHandleResponse({
			updateLoading: true,
			errorMessage: "",
			successMessage: "",
		});

		if (name === "" || number === "") {
			setIsAlertOpen(true);
			setHandleResponse({
				updateLoading: false,
				errorMessage: "Please enter both name and number",
			});
			return;
		}

		// * action = add
		const action = e.target.name;

		const noHyphenSpaceNumber = number.split("").slice(1).join("");

		if (noHyphenSpaceNumber.length !== 10) {
			setIsAlertOpen(true);
			setHandleResponse({
				updateLoading: false,
				errorMessage: "Please enter an appropriate number",
			});
			return;
		}

		const args = { name, noHyphenSpaceNumber, uid, bizId, action };
		const resUpdateNum = await addBizTextNumbers(args);
		if (resUpdateNum.success) {
			setIsAlertOpen(true);
			setHandleResponse({
				updateLoading: false,
				successMessage: resUpdateNum.message,
			});
		} else {
			setIsAlertOpen(true);
			setHandleResponse({
				updateLoading: false,
				errorMessage: resUpdateNum.message,
			});
		}
	}

	async function handleSaveChanges(e) {
		setHandleResponse({
			saveLoading: true,
			saveErrorMessage: "",
			saveMessage: "",
		});
		const textNumbersObj = {};
		for (let i = 0; i < settingValues.length; i++) {
			const currObj = settingValues[i];
			const num = currObj.number;
			const numArr = num.split("");
			const numNoSpaceCharArr = [];

			for (let i = 0; i < numArr.length; i++) {
				const curr = numArr[i];

				if (curr === "(") {
					continue;
				}
				if (curr === ")") {
					continue;
				}
				if (curr === " ") {
					continue;
				}
				numNoSpaceCharArr.push(curr);
			}

			const numNoSpaceChar = numNoSpaceCharArr.join("");

			currObj.number = numNoSpaceChar;

			textNumbersObj[numNoSpaceChar] = currObj;
		}

		const resSaveChanges = await updateBizTextNumbers(textNumbersObj, bizId);
		if (resSaveChanges.success) {
			setIsSaveAlertOpen(true);
			setHandleResponse({
				saveLoading: false,
				saveSuccessMessage: resSaveChanges.message,
			});
			setIsEdit(false);
			loadBizData(bizId);
		} else {
			setIsSaveAlertOpen(true);
			setHandleResponse({
				saveLoading: false,
				saveErrorMessage: resSaveChanges.message,
			});
			setIsEdit(false);
		}
	}

	async function handleDelete(e, number) {
		setHandleResponse({
			saveLoading: true,
			saveErrorMessage: "",
			saveMessage: "",
		});

		const updatedNumArray = settingValues.filter(
			(item) => item.number !== number
		);

		const textNumbersObj = {};
		for (let i = 0; i < updatedNumArray.length; i++) {
			const currObj = updatedNumArray[i];
			const num = currObj.number;
			const numArr = num.split("");
			const numNoSpaceCharArr = [];

			for (let i = 0; i < numArr.length; i++) {
				const curr = numArr[i];
				if (curr === "(") {
					continue;
				}
				if (curr === ")") {
					continue;
				}
				if (curr === " ") {
					continue;
				}
				numNoSpaceCharArr.push(curr);
			}

			const numNoSpaceChar = numNoSpaceCharArr.join("");

			currObj.number = numNoSpaceChar;

			textNumbersObj[numNoSpaceChar] = currObj;
		}

		const resSaveChanges = await updateBizTextNumbers(textNumbersObj, bizId);
		if (resSaveChanges.success) {
			setIsSaveAlertOpen(true);
			setHandleResponse({
				saveLoading: false,
				saveSuccessMessage: resSaveChanges.message,
			});
			setIsEdit(false);
			loadBizData(bizId);
		} else {
			setIsSaveAlertOpen(true);
			setHandleResponse({
				saveLoading: false,
				saveErrorMessage: resSaveChanges.message,
			});
			setIsEdit(false);
		}
	}

	function handleChange(e, idx) {
		const { name, checked } = e.target;
		let newArr = [...settingValues];
		if (checked) {
			newArr[idx] = { ...newArr[idx], isSelected: true };
		} else {
			newArr[idx] = { ...newArr[idx], isSelected: false };
		}
		setSettingValues(newArr);
	}

	function handleIsChecked(isSelected) {
		return isSelected;
	}

	function handleModalChange(e, name) {
		if (name === "number") {
			if (!e) {
				return;
			}
			setNewNumber((prev) => ({ ...prev, [name]: e }));
		} else {
			const { value } = e.target;
			setNewNumber((prev) => ({ ...prev, [name]: value }));
		}
	}

	return (
		<Layout uid={uid} currentPage="Settings">
			{pageLoading && <CircularProgress />}
			<div className={styles.Settings}>
				<div className={`${styles.InfoContainer}`}>
					<div className={styles.Settings_Flex}>
						<h3>Text notifications</h3>

						<PermPhoneMsgRoundedIcon sx={{ color: "var(--gray)" }} />
						{saveSuccessMessage && (
							<Grid item xs={12} md={12}>
								<Collapse in={isSaveAlertOpen}>
									<Alert
										severity="success"
										onClose={() => {
											setIsSaveAlertOpen(false);
										}}
									>
										<AlertTitle>Success</AlertTitle>
										{saveSuccessMessage}
									</Alert>
								</Collapse>
							</Grid>
						)}
						{saveErrorMessage && (
							<Grid item xs={12} md={12}>
								<Collapse in={isSaveAlertOpen}>
									<Alert
										severity="error"
										onClose={() => {
											setIsSaveAlertOpen(false);
										}}
									>
										<AlertTitle>Error</AlertTitle>
										{saveErrorMessage}
									</Alert>
								</Collapse>
							</Grid>
						)}
					</div>
					<p style={{ color: "var(--gray)", fontSize: "14px" }}>
						* Select the phone number(s) to receive a text when receiving and
						order.
					</p>
					<div className={styles.Settings_Flex}>
						{settingValues.map((values, idx) => {
							return (
								<div
									key={values.number}
									className={
										isEdit
											? `${styles.Settings_numberGroupEdit}`
											: `${styles.Settings_numberGroupNoEdit}`
									}
								>
									<FormGroup key={idx}>
										<FormControlLabel
											control={
												<Checkbox
													disabled={!isEdit}
													id={values.number}
													name={values.name}
													onChange={(e) => handleChange(e, idx)}
													checked={handleIsChecked(values.isSelected)}
												/>
											}
											label={`${values.name} - ${values.number}`}
										/>
									</FormGroup>

									<Button
										disabled={!isEdit}
										name="delete"
										variant="text"
										color="error"
										size="small"
										onClick={(e) => handleDelete(e, values.number)}
									>
										Delete
									</Button>
								</div>
							);
						})}
					</div>
					<div className={styles.Settings_buttonsContainer}>
						<div className={styles.Settings_editGroup}>
							<Button
								type="button"
								onClick={() => {
									setIsEdit((prev) => !prev);
									if (isEdit) {
										loadBizData(bizId);
									}
								}}
								variant="text"
								color={isEdit ? "error" : "primary"}
								mr={3}
							>
								{isEdit ? "Close" : "Edit"}
							</Button>
							{isEdit && (
								<Button
									type="button"
									name="save"
									onClick={handleSaveChanges}
									variant="outlined"
								>
									Save changes
								</Button>
							)}
						</div>
						<Button
							type="button"
							onClick={() => setIsModalOpen(true)}
							variant="contained"
							sx={{ height: "fit-content" }}
						>
							+ Add
						</Button>

						<Modal
							open={isModalOpen}
							onClose={() => {
								setNewNumber({ number: "", name: "" });
								setIsModalOpen(false);
							}}
							aria-labelledby="modal-modal-title"
							aria-describedby="modal-modal-description"
						>
							<Box sx={modalStyle}>
								<Typography id="modalTitle" variant="h6">
									Add number
								</Typography>
								<input
									className={styles.Settings_phoneInput}
									id="name"
									placeholder="Name"
									value={name}
									onChange={(e) => handleModalChange(e, "name")}
									fullWidth
								/>

								<PhoneInput
									inputClass={styles.Settings_phoneInput}
									country="us"
									placeholder="Enter phone number"
									value={number}
									specialLabel=""
									onChange={(e) => handleModalChange(e, "number")}
								/>

								{successMessage && (
									<Grid item xs={12} md={12}>
										<Collapse in={isAlertOpen}>
											<Alert
												severity="success"
												onClose={() => {
													setIsAlertOpen(false);
												}}
											>
												<AlertTitle>Success</AlertTitle>
												{successMessage}
											</Alert>
										</Collapse>
									</Grid>
								)}
								{errorMessage && (
									<Grid item xs={12} md={12}>
										<Collapse in={isAlertOpen}>
											<Alert
												severity="error"
												onClose={() => {
													setIsAlertOpen(false);
												}}
											>
												<AlertTitle>Error</AlertTitle>
												{errorMessage}
											</Alert>
										</Collapse>
									</Grid>
								)}
								<Button
									type="button"
									name="add"
									onClick={handleAddNumber}
									variant="contained"
									sx={{ marginTop: "10px" }}
								>
									Save
								</Button>
								<Button
									type="button"
									onClick={() => {
										setNewNumber({ name: "", number: "" });
										setIsModalOpen(false);
										if (name !== "" && number !== "") {
											loadBizData(bizId);
										}
									}}
									variant="text"
									color="error"
								>
									Cancel
								</Button>
							</Box>
						</Modal>
					</div>
				</div>
			</div>
		</Layout>
	);
}

export default Text;
