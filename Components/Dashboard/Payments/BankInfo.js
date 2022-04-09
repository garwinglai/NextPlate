import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/payments/bankinfo.module.css";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import { Button, Grid } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { connectStripeAccount } from "../../../actions/heroku/stripeAccount";
import { useRouter } from "next/router";

function BankInfo({ stripeAccId, detailsSubmitted, errMsg, uid }) {
	const [isSuccessAlertOpen, setIsSuccessAlertOpen] =
		useState(detailsSubmitted);
	const [isErrorAlertOpen, setIsErrorAlertOpen] = useState(
		errMsg ? true : false
	);
	const [isAlertOpen, setIsAlertOpen] = useState(true);
	const [responseHandle, setResponseHandle] = useState({
		loading: false,
		successMessage: detailsSubmitted ? "Bank account connected." : "",
		errorMessage: errMsg,
	});

	const { loading, successMessage, errorMessage } = responseHandle;

	const router = useRouter();

	// * ACTIONS -----------------------------------------------------------------

	async function handleConnectStripe(e, stripeAccId) {
		setResponseHandle((prev) => ({ ...prev, loading: true }));
		const refreshUrl = `https://next-plate.web.app/dashboard/${uid}/payments`;
		const returnUrl = `https://next-plate.web.app/dashboard/${uid}/payments`;

		let resConnectStripe = await connectStripeAccount(
			stripeAccId,
			refreshUrl,
			returnUrl
		);
		if (resConnectStripe.success) {
			const stripeUrl = resConnectStripe.url;
			router.push(stripeUrl);
		} else {
			setResponseHandle((prev) => ({
				...prev,
				loading: false,
				successMessage: "",
				errorMessage: resConnectStripe.message,
			}));
		}
	}

	async function handleClickPayout() {
		// TODO: handle cash out
		window.alert("payout");
	}

	return (
		<div className={`${styles.BankInfo} ${styles.flexCol}`}>
			<div className={`${styles.BankInfo__header} ${styles.flexRow}`}>
				<div className={`${styles.BankInfo__BoxHeader} ${styles.Box} `}>
					<h5>Balance</h5>
					<h1>$0.00</h1>
				</div>

				{successMessage && (
					<Grid item xs={12} md={12} mt={2}>
						<Collapse in={isSuccessAlertOpen}>
							<Alert
								severity="success"
								className={styles.Alert}
								onClose={() => {
									setIsSuccessAlertOpen(false);
								}}
							>
								<AlertTitle className={styles.AlertTitle}>Success</AlertTitle>
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
								className={styles.Alert}
								onClose={() => {
									setIsErrorAlertOpen(false);
								}}
							>
								<AlertTitle className={styles.AlertTitle}>Error</AlertTitle>
								{errorMessage}
							</Alert>
						</Collapse>
					</Grid>
				)}
				{!detailsSubmitted && (
					<Grid item xs={12} md={12} mt={2}>
						<Collapse in={isAlertOpen}>
							<Alert severity="info" className={styles.Alert}>
								<AlertTitle className={styles.AlertTitle}>
									Information
								</AlertTitle>
								No bank information. Add bank information in order to receive
								payouts.
							</Alert>
						</Collapse>
					</Grid>
				)}
			</div>
			{loading ? (
				<CircularProgress />
			) : (
				<div className={styles.paymentButton}>
					<Button
						variant="contained"
						size="large"
						fullWidth
						onClick={
							!detailsSubmitted
								? (e) => handleConnectStripe(e, stripeAccId)
								: handleClickPayout
						}
					>
						{!detailsSubmitted ? "+ Connect Bank" : "Payout"}
					</Button>
				</div>
			)}
		</div>
	);
}

export default BankInfo;
