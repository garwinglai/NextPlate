import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { getSessionStorage, setSessionStorage } from "../../actions/auth/auth";
import _ from "lodash";
import { checkEmailInUse } from "../../actions/crud/bizUser";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import Link from "next/link";

export default function SignUpForm({
	currentStep,
	stepsArray,
	handleNext,
	handleBack,
}) {
	const [open, setOpen] = useState(false);
	const [signUpValues, setSignUpValues] = useState({
		firstName: "",
		lastName: "",
		email: "",
		password: "",
	});
	const [loginRes, setLoginRes] = useState({
		loading: false,
		message: "",
	});

	const { firstName, lastName, email, password } = signUpValues;
	const { loading, message } = loginRes;

	useEffect(() => {
		const tempLogin = getSessionStorage("tempLoginInfo");
		if (tempLogin) {
			const { capFirst, capLast, email, password } = JSON.parse(tempLogin);
			setSignUpValues({
				firstName: capFirst,
				lastName: capLast,
				email,
				password,
			});
		}
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;

		setSignUpValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleNextPage = async (e) => {
		e.preventDefault();
		setLoginRes({ loading: true, message: "" });
		const { success, message } = await checkEmailInUse(email);

		if (success) {
			const capFirst = _.capitalize(firstName);
			const capLast = _.capitalize(lastName);
			setSessionStorage("tempLoginInfo", {
				capFirst,
				capLast,
				email,
				password,
			});
			setLoginRes({ loading: false, message: "" });
			handleNext();
		} else {
			setOpen(true);
			setLoginRes({ loading: false, message });
		}
	};

	const handlePrevPage = () => {
		handleBack();
	};

	return (
		<React.Fragment>
			<Typography variant="h6" gutterBottom>
				Login Information
			</Typography>
			<form onSubmit={(e) => handleNextPage(e, signUpValues)}>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<TextField
							required
							id="firstName"
							label="* First name"
							type="text"
							name="firstName"
							value={firstName}
							fullWidth
							variant="standard"
							onChange={handleChange}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							required
							id="lastName"
							name="lastName"
							value={lastName}
							type="text"
							label="* Last name"
							fullWidth
							variant="standard"
							onChange={handleChange}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							required
							id="email"
							label="* Email"
							type="email"
							name="email"
							value={email}
							fullWidth
							variant="standard"
							onChange={handleChange}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							required
							id="password"
							label="* password (min length 8)"
							inputProps={{ minLength: 8 }}
							type="password"
							name="password"
							value={password}
							fullWidth
							variant="standard"
							onChange={handleChange}
						/>
					</Grid>
					{message && (
						<Grid item xs={12} md={12}>
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
					<Box
						sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
					>
						{currentStep !== 0 && (
							<Button
								type="button"
								onClick={handlePrevPage}
								sx={{ mt: 3, ml: 1 }}
							>
								Back
							</Button>
						)}
						{loading ? (
							<CircularProgress />
						) : (
							<Button
								variant="contained"
								type="submit"
								sx={{ mt: 3, mb: 3, ml: 1 }}
							>
								Next
							</Button>
						)}
					</Box>
				</Grid>
			</form>
			<Grid item xs={12} md={12}>
				<Link href="/business/signin">
					<a style={{ color: "var(--dark-blue)", textDecoration: "underline" }}>
						Already have account? Sign in.
					</a>
				</Link>
			</Grid>
		</React.Fragment>
	);
}
