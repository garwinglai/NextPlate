import Link from "next/link";
import React, { useState, useEffect } from "react";
import Layout from "../../Components/Layout";
import styles from "../../styles/pages/business/signin.module.css";
import { useRouter } from "next/router";
import {
	signInBiz,
	getLocalStorage,
	isAuth,
	getCookie,
	forgotPassword,
} from "../../actions/auth/auth";
import CircularProgress from "@mui/material/CircularProgress";
import { getBizUserNew } from "../../actions/crud/bizUser";
import { setLocalStorage } from "../../actions/auth/auth";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import Image from "next/image";
import MyLoader from "../../helper/MyLoader";
import _ from "lodash";
import { versionNumber } from "../../staticData/versionNumber";

function Copyright(props) {
	return (
		<Typography
			variant="body2"
			color="text.secondary"
			align="center"
			{...props}
		>
			{"Copyright © "}
			<Link color="inherit" href="https://mui.com/">
				Next Plate
			</Link>{" "}
			{new Date().getFullYear()}
			{"."}
		</Typography>
	);
}

const theme = createTheme();

export default function SignIn() {
	const [open, setOpen] = useState(false);
	const [isRememberMeChecked, setIsRememberMeChecked] = useState(true);
	const [signInLoading, setSignInLoading] = useState(false);
	const [signInErrorMessage, setSignInErrorMessage] = useState("");
	const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
	const [signInValues, setSignInValues] = useState({
		email: "",
		password: "",
		rememberMe: false,
	});

	const { email, password, rememberMe } = signInValues;

	const router = useRouter();

	useEffect(() => {
		if (!isAuth()) {
			const rememberedEmail = getLocalStorage("rememberedEmail");
			const rememberCheckbox = getLocalStorage("rememberCheckbox");

			if (rememberedEmail) {
				setSignInValues((prev) => ({
					...prev,
					email: JSON.parse(rememberedEmail),
					rememberMe: JSON.parse(rememberCheckbox),
				}));
				setIsRememberMeChecked(true);
			}
		} else {
			setSignInLoading(true);
			const uid = getCookie("uid");
			router.push(`/dashboard/${uid}/orders/incoming-orders`);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function handleSubmitForm(e) {
		e.preventDefault();
		setSignInLoading(true);
		setOpen(false);

		const signInVal = {
			email: _.toLower(email),
			password,
			rememberMe,
		};

		// console.log(signInValues);
		const resSignIn = await signInBiz(signInVal);

		if (resSignIn.success) {
			const uid = resSignIn.uid;

			const resBizUser = await getBizUserNew(uid);
			if (resBizUser.success) {
				const userData = resBizUser.userData;
				const bizOwnedKeys = Object.keys(userData.bizOwned);
				userData.bizId = userData.bizOwned[bizOwnedKeys[0]].id;
				userData.bizName = userData.bizOwned[bizOwnedKeys[0]].name;
				userData.email = userData.login.email;
				userData.login = "";
				userData.ownerContact = "";
				// const version = userData.bizOwned[bizOwnedKeys[0]].version;

				setLocalStorage("version", versionNumber);
				setLocalStorage("user", userData);
				setLocalStorage("uid", uid);
				router.push(`/dashboard/${uid}/orders/incoming-orders`);
			} else {
				setOpen(true);
				setSignInLoading(false);
				setSignInErrorMessage(resSignIn.message);
				return;
			}
		} else {
			setOpen(true);
			setSignInLoading(false);
			setSignInErrorMessage(resSignIn.message);
		}
	}

	async function handleForgotPassword(e) {
		if (!email || email === "") {
			setOpen(true);
			setForgotPasswordMessage(
				"Please enter your login email above and click forgot password to receive an email to reset your password."
			);
			return;
		}

		setSignInLoading(true);

		const { success, message } = await forgotPassword(email);

		if (success) {
			setSignInLoading(false);
			setOpen(true);
			setForgotPasswordMessage(`Password reset email sent to ${email}.`);
		} else {
			setSignInLoading(false);
			setOpen(true);
			setForgotPasswordMessage(message);
		}
	}

	function handleChangeForm(e) {
		const target = e.target;
		const name = target.name;
		const value = target.type === "checkbox" ? target.checked : target.value;

		if (target.type === "checkbox") {
			setIsRememberMeChecked((prev) => !prev);
		}

		setSignInValues((prev) => ({ ...prev, [name]: value }));
	}

	return (
		<Layout currentPage="public">
			<ThemeProvider theme={theme}>
				<Container component="main" maxWidth="xs">
					<CssBaseline />
					<Box
						sx={{
							marginTop: 8,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<Image
							loader={MyLoader}
							src="https://img.icons8.com/stickers/50/000000/password.png"
							width="50px"
							height="50px"
							alt="sign in lock image"
						/>
						<Typography component="h1" variant="h5" mb={2}>
							Sign in
						</Typography>
						<Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 1 }}>
							<input
								onChange={handleChangeForm}
								name="email"
								type="email"
								placeholder="Email Address *"
								value={email}
								required
								className={styles.Signin__Input}
							/>
							<input
								onChange={handleChangeForm}
								name="password"
								type="password"
								placeholder="Password *"
								value={password}
								required
								className={styles.Signin__Input}
							/>
							<div
								style={{ display: "flex", alignItems: "center", gap: "10px" }}
								className={`${styles.Remember__Me}`}
							>
								<input
									onChange={handleChangeForm}
									name="rememberMe"
									type="checkbox"
									id="remember-me"
									value={rememberMe}
									checked={isRememberMeChecked}
								/>
								<label htmlFor="remember-me">Remember login email</label>
							</div>
							{signInErrorMessage && (
								<Grid item xs={12} md={12} mt={2}>
									<Collapse in={open}>
										<Alert
											severity="error"
											onClose={() => {
												setOpen(false);
											}}
										>
											<AlertTitle>Error</AlertTitle>
											{signInErrorMessage}
										</Alert>
									</Collapse>
								</Grid>
							)}
							{forgotPasswordMessage && (
								<Grid item xs={12} md={12} mt={2}>
									<Collapse in={open}>
										<Alert
											severity="info"
											onClose={() => {
												setOpen(false);
											}}
										>
											<AlertTitle>Forgot password info</AlertTitle>
											{forgotPasswordMessage}
										</Alert>
									</Collapse>
								</Grid>
							)}
							{signInLoading ? (
								<CircularProgress />
							) : (
								<Button
									type="submit"
									fullWidth
									variant="contained"
									sx={{ mt: 3, mb: 2 }}
									size="large"
								>
									Sign In
								</Button>
							)}
							<Grid container display="flex" alignItems="center">
								<Grid item xs>
									<Button
										variant="filled"
										onClick={handleForgotPassword}
										sx={{
											width: "max-content",
											// height: "0",
											padding: "0",
											marginRight: "40px",
											fontSize: "12px",
										}}
									>
										Forgot password?
									</Button>
								</Grid>
								<Grid item>
									<Link href="https://www.home.nextplate.app/business-signup">
										<a className={styles.links}>
											Don&apos;t have an Account? Sign up.
										</a>
									</Link>
								</Grid>
							</Grid>
						</Box>
					</Box>
					<Copyright sx={{ mt: 8, mb: 4 }} />
				</Container>
			</ThemeProvider>
		</Layout>
	);
}
