import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Link from "@mui/material/Link";
import Image from "next/image";
import MyLoader from "../../../helper/MyLoader";
import AddBizInfoForm from "../../Auth/AdditionalBiz/AddBizInfoForm";
import AddBizReview from "../../Auth/AdditionalBiz/AddBizReview";
import { removeSessionStorage } from "../../../actions/auth/auth";
import styles from "../../../styles/components/dashboard/stores/storemodal.module.css";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	Height: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
	overflowY: "scroll",
};

const Copyright = () => {
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
};

const steps = ["Business information", "Review"];

function getStepContent(step, handleNext, handleBack, bizContact, existingBiz) {
	switch (step) {
		case 0:
			return (
				<AddBizInfoForm
					currentStep={step}
					stepsArray={steps}
					handleNext={handleNext}
					handleBack={handleBack}
					bizContact={bizContact}
				/>
			);
		case 1:
			return (
				<AddBizReview
					currentStep={step}
					stepsArray={steps}
					handleNext={handleNext}
					handleBack={handleBack}
					existingBiz={existingBiz}
				/>
			);
		default:
			throw new Error("Unknown step");
	}
}
function StoreModal({ isOpen, close, bizContact, existingBiz }) {
	const [activeStep, setActiveStep] = useState(0);
	const handleNext = () => {
		setActiveStep((prev) => prev + 1);
	};

	const handleBack = () => {
		setActiveStep((prev) => prev - 1);
	};

	const handleCloseForm = () => {
		removeSessionStorage("tempLoginInfo");
		removeSessionStorage("tempBizInfo");
		close();
	};

	return (
		<div>
			<Modal
				open={isOpen}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
				className={`${styles.StoreModal}`}
			>
				<Container component="main" maxWidth="sm" sx={{ mb: 4 }}>
					<Paper
						variant="outlined"
						sx={{
							my: { xs: 3, md: 6 },
							p: { xs: 2, md: 3 },
							maxHeight: "80vh",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<div
							style={{
								width: "100%",
								textAlign: "right",
							}}
						>
							<Button
								color="error"
								variant="contained"
								sx={{ textAlign: "right" }}
								onClick={handleCloseForm}
							>
								Close
							</Button>
						</div>
						<div style={{ display: "flex", justifyContent: "center" }}>
							<Image
								loader={MyLoader}
								alt="shop icon"
								width="50px"
								height="50px"
								src="https://img.icons8.com/office/40/000000/shop.png"
							/>
						</div>
						<Typography component="h1" variant="h4" align="center">
							{activeStep === steps.length ? "Success" : "Add Store"}
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
										Your business has been successfully added.
									</Typography>
									<Typography variant="subtitle1">
										Please close this tab and refresh the page to see your newly
										added business. If there are any errors, please email us at
										nextplateapp@gmail.com.
									</Typography>
								</React.Fragment>
							) : (
								<React.Fragment>
									{getStepContent(
										activeStep,
										handleNext,
										handleBack,
										bizContact,
										existingBiz
									)}
								</React.Fragment>
							)}
						</React.Fragment>
					</Paper>
					<Copyright />
				</Container>
			</Modal>
		</div>
	);
}

export default StoreModal;
