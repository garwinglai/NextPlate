import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import styles from "../../../styles/pages/dashboard/payments.module.css";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { Button, Grid } from "@mui/material";
import {
	addBankNumber,
	getBiz,
	removeBankNumber,
} from "../../../actions/crud/bizUser";
import { getLocalStorage } from "../../../actions/auth/auth";
import { CircularProgress } from "@mui/material";

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

function paymentHistoryComponent() {
	return (
		<p
			style={{
				textAlign: "center",
				color: "var(--light-gray)",
				marginTop: "30px",
			}}
		>
			No payment history
		</p>
	);
}

export default function Payments() {
	const [value, setValue] = useState(0);
	const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
	const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(false);
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const [isEdit, setIsEdit] = useState(false);
	const [handleGetPage, setHandleGetPage] = useState({
		pageLoading: false,
		pageError: "",
	});
	const [bankInformation, setBankInformation] = useState({
		bankNickName: "",
		bankName: "",
		routingNumber: "",
		accountNumber: "",
		payoutMethod: 0,
		exists: true,
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [responseHandle, setResponseHandle] = useState({
		loading: false,
		successMessage: "",
		errorMessage: "",
	});

	const { pageLoading, pageError } = handleGetPage;
	const { loading, successMessage, errorMessage } = responseHandle;
	const { storedUser, bizId } = user;
	const {
		bankNickName,
		bankName,
		routingNumber,
		accountNumber,
		payoutMethod,
		exists,
	} = bankInformation;

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

		loadBankAccount(bizIdTemp);
	}, []);

	// * UseEffect Actions ------------------------------------------
	async function loadBankAccount(bizIdTemp) {
		setHandleGetPage({ loading: true, pageError: "" });
		const resLoadBankAccount = await getBiz(bizIdTemp, null);

		if (resLoadBankAccount.success) {
			setHandleGetPage({ loading: false });
			const bankInf = resLoadBankAccount.docData.bankInfo;

			if (bankInf && Object.keys(bankInf).length !== 0) {
				const bankDataArr = [];
				// ! Only loads one bank account.
				for (let key in bankInf) {
					bankDataArr.push(bankInf[key]);
				}

				const bankData = bankDataArr[0];

				setBankInformation((prev) => ({
					...prev,
					bankNickName: bankData.bankNickName,
					bankName: bankData.bankName,
					routingNumber: bankData.routingNumber,
					accountNumber: bankData.accountNumber,
					payoutMethod: bankData.payoutMethod,
					exists: true,
				}));
			} else {
				setBankInformation((prev) => ({
					...prev,
					bankNickName: "",
					bankName: "",
					routingNumber: "",
					accountNumber: "",
					payoutMethod: 0,
					exists: false,
				}));
			}
		} else {
			setHandleGetPage({
				loading: false,
				pageError: "Error loading bank account details.",
			});
			setBankInformation((prev) => ({
				...prev,
				exists: false,
			}));
		}
	}

	// * Actions ------------------------------------------
	function handleChange(e, newValue) {
		setValue(newValue);
	}

	async function handleBankSubmit(e) {
		setResponseHandle({ loading: true, successMessage: "", errorMessage: "" });
		e.preventDefault();

		const bankInfo = {
			bankNickName,
			bankName,
			routingNumber,
			accountNumber,
			payoutMethod,
		};

		const resAddBankInfo = await addBankNumber(bizId, bankInfo);

		if (resAddBankInfo.success) {
			setResponseHandle({
				loading: false,
				successMessage: exists
					? "Successfully updated bank information"
					: resAddBankInfo.message,
				errorMessage: "",
			});
			loadBankAccount(bizId);
			setIsAlertOpen(false);
			setIsSuccessAlertOpen(true);
			setIsEdit(false);
		} else {
			setResponseHandle({
				loading: false,
				successMessage: "",
				errorMessage: resAddBankInfo.message,
			});
			setIsErrorAlertOpen(true);
			setIsEdit(false);
		}
	}

	async function handleRemove() {
		setResponseHandle({ loading: false, successMessage: "", errorMessage: "" });
		const resRemoveBankAcc = await removeBankNumber(bizId, routingNumber);
		if (resRemoveBankAcc.success) {
			setResponseHandle({
				loading: false,
				successMessage: resRemoveBankAcc.message,
			});
			setIsAlertOpen(true);
			setIsSuccessAlertOpen(true);
			setIsEdit(false);
			loadBankAccount(bizId);
		} else {
			setResponseHandle({
				loading: false,
				errorMessage: resRemoveBankAcc.message,
			});
			setIsErrorAlertOpen(true);
			setIsEdit(false);
		}
	}

	function handleBankChange(e) {
		const { name, value } = e.target;
		setBankInformation((prev) => ({ ...prev, [name]: value }));
	}

	// * Displays ------------------------------------------
	function bankInformationComponent() {
		return (
			<div className={`${styles.BankInfo} ${styles.flexCol}`}>
				<div className={`${styles.BankInfo__header} ${styles.flexRow}`}>
					<div className={`${styles.BankInfo__BoxHeader} ${styles.Box} `}>
						<h5>Balance</h5>
						<h1>$402.42</h1>
					</div>
					{successMessage && (
						<Grid item xs={12} md={12} mt={2}>
							<Collapse in={isSuccessAlertOpen}>
								<Alert
									severity="success"
									onClose={() => {
										setIsSuccessAlertOpen(false);
									}}
								>
									<AlertTitle>Success</AlertTitle>
									{successMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{errorMessage && (
						<Grid item xs={12} md={12} mt={2}>
							<Collapse in={isErrorAlertOpen}>
								<Alert
									severity="error"
									onClose={() => {
										setIsErrorAlertOpen(false);
									}}
								>
									<AlertTitle>Error</AlertTitle>
									{errorMessage}
								</Alert>
							</Collapse>
						</Grid>
					)}
					{!exists && (
						<Grid item xs={12} md={12} mt={2}>
							<Collapse in={isAlertOpen}>
								<Alert severity="info">
									<AlertTitle>Information</AlertTitle>
									No bank information. Add bank information in order to receive
									payouts.
								</Alert>
							</Collapse>
						</Grid>
					)}
				</div>
				<div className={`${styles.BankInfo__accounts} ${styles.Box}`}>
					<form onSubmit={handleBankSubmit}>
						<div className={` ${styles.BankInfo__BoxMain}`}>
							<h3>Bank account</h3>
							<div className={`${styles.flexCol}`}>
								<div className={`${styles.flexRow}`}>
									<div className={`${styles.inputLabel}`}>
										<label htmlFor="bankNickName">Bank nickname</label>
										<input
											disabled={!isEdit}
											required
											type="text"
											id="bankNickName"
											name="bankNickName"
											value={bankNickName}
											onChange={handleBankChange}
										/>
									</div>
									<div className={`${styles.inputLabel}`}>
										<label htmlFor="bankNickName">Bank name</label>
										<input
											disabled={!isEdit}
											required
											type="text"
											id="bankName"
											name="bankName"
											value={bankName}
											onChange={handleBankChange}
										/>
									</div>
								</div>
								<div className={`${styles.inputLabel}`}>
									<label htmlFor="bankNickName">Rounting number</label>
									<input
										disabled={!isEdit}
										required
										type="text"
										id="routingNumber"
										name="routingNumber"
										value={routingNumber}
										onChange={handleBankChange}
									/>
								</div>
								<div className={`${styles.inputLabel}`}>
									<label htmlFor="bankNickName">Account number</label>
									<input
										disabled={!isEdit}
										required
										type="text"
										id="accountNumber"
										name="accountNumber"
										value={accountNumber}
										onChange={handleBankChange}
									/>
								</div>
								<div className={`${styles.inputLabel}`}>
									<label htmlFor="payoutMethod">Payout method</label>
									<select
										disabled={!isEdit}
										required
										id="payoutMethod"
										name="payoutMethod"
										value={payoutMethod}
										label="Age"
										onChange={handleBankChange}
									>
										<option value={0}>Monthly payouts</option>
										<option value={1}>Payout at $250 balance</option>
									</select>
								</div>
							</div>
						</div>
						{isEdit ? (
							<div className={`${styles.flexRow}`}>
								<div>
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
											loadBankAccount(bizId);
											setIsEdit(false);
										}}
									>
										Cancel
									</Button>
								</div>
								{exists && (
									<Button
										variant="text"
										size="small"
										type="button"
										color="error"
										onClick={handleRemove}
									>
										Remove
									</Button>
								)}
							</div>
						) : (
							<div className={`${styles.editButtonGroup}`}>
								<Button
									variant={!exists ? "contained" : "outlined"}
									sx={{ width: "auto" }}
									size="small"
									type="button"
									onClick={() => setIsEdit(true)}
								>
									{!exists ? "+ Add bank account" : "Edit"}
								</Button>
							</div>
						)}
					</form>
				</div>
			</div>
		);
	}

	return (
		<Layout uid={uid} currentPage="Payments">
			{pageLoading && <CircularProgress />}
			<Box sx={{ width: "100%", padding: "20px" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={value}
						onChange={handleChange}
						aria-label="basic tabs example"
					>
						<Tab label="Bank information" {...a11yProps(0)} />
						<Tab label="Payment history" {...a11yProps(1)} />
					</Tabs>
				</Box>
				<TabPanel value={value} index={0}>
					{bankInformationComponent()}
				</TabPanel>
				<TabPanel value={value} index={1}>
					{paymentHistoryComponent()}
				</TabPanel>
			</Box>
		</Layout>
	);
}
