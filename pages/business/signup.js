import React, { useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import SignUpForm from "../../Components/Auth/SignUpForm";
import BizInfoForm from "../../Components/Auth/BizInfoForm";
import Review from "../../Components/Auth/Review";
import Layout from "../../Components/Layout";
import Image from "next/image";
import MyLoader from "../../helper/MyLoader";

function Copyright() {
	return (
		<Typography variant="body2" color="text.secondary" align="center">
			{"Copyright © "}
			<Link color="inherit" href="https://mui.com/">
				Next Plate
			</Link>{" "}
			{new Date().getFullYear()}
			{"."}
		</Typography>
	);
}

const steps = ["Login information", "Business information", "Review"];

function getStepContent(step, handleNext, handleBack) {
	switch (step) {
		case 0:
			return (
				<SignUpForm
					currentStep={step}
					stepsArray={steps}
					handleNext={handleNext}
					handleBack={handleBack}
				/>
			);
		case 1:
			return (
				<BizInfoForm
					currentStep={step}
					stepsArray={steps}
					handleNext={handleNext}
					handleBack={handleBack}
				/>
			);
		case 2:
			return (
				<Review
					currentStep={step}
					stepsArray={steps}
					handleNext={handleNext}
					handleBack={handleBack}
				/>
			);
		default:
			throw new Error("Unknown step");
	}
}

export default function SignUp() {
	const [activeStep, setActiveStep] = useState(0);

	const handleNext = () => {
		setActiveStep((prev) => prev + 1);
	};

	const handleBack = () => {
		setActiveStep((prev) => prev - 1);
	};

	return (
		<Layout currentPage="public">
			<Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
				<Paper
					variant="outlined"
					sx={{
						my: { xs: 3, md: 6 },
						p: { xs: 2, md: 3 },
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div style={{ display: "flex", justifyContent: "center" }}>
						<Image
							loader={MyLoader}
							alt="lock icon"
							width="50px"
							height="50px"
							src="https://img.icons8.com/stickers/50/000000/user-folder.png"
						/>
					</div>
					<Typography component="h1" variant="h4" align="center">
						{activeStep === steps.length ? "Success" : "Sign Up"}
					</Typography>
					<Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
						{steps.map((label) => (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						))}
					</Stepper>
					<React.Fragment>
						{activeStep === steps.length ? (
							<React.Fragment>
								<Typography variant="h5" gutterBottom>
									Thank you for creating your account.
								</Typography>
								<Typography variant="subtitle1">
									Your account is currently under review. If your business is
									approved, we will notify you through email for your onboarding
									process.
								</Typography>
							</React.Fragment>
						) : (
							<React.Fragment>
								{getStepContent(activeStep, handleNext, handleBack)}
							</React.Fragment>
						)}
					</React.Fragment>
				</Paper>
				<Copyright />
			</Container>
		</Layout>
	);
}
