import React, { useState, useEffect, useLayoutEffect } from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {
	getSessionStorage,
	removeSessionStorage,
} from "../../actions/auth/auth";
import { serverTimestamp } from "firebase/firestore";
import { signUpBiz } from "../../actions/auth/auth";
import createBizAccount from "../../actions/crud/bizUser";
import { CircularProgress } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import _ from "lodash";
import { versionNumber } from "../../staticData/versionNumber";

const createNameCombinations = (name) => {
	let fullCombination;
	const lowerCaseName = _.toLower(name);
	const nameArr = lowerCaseName.split(" ");
	const nameArrLen = nameArr.length;
	const finalNameArr = nameArr.reduce(
		(acc, v, i) => acc.concat(nameArr.slice(i + 1).map((w) => v + " " + w)),
		[]
	);

	if (nameArrLen === 0) {
		return;
	}
	if (nameArrLen === 1) {
		return nameArr;
	} else if (nameArrLen === 2) {
		fullCombination = finalNameArr.concat(nameArr);
		return fullCombination;
	} else {
		fullCombination = finalNameArr.concat(nameArr).concat(lowerCaseName);
		return fullCombination;
	}
};

export default function Review({
	currentStep,
	stepsArray,
	handleNext,
	handleBack,
}) {
	const [open, setOpen] = useState(false);
	const [loginValues, setLoginValues] = useState({});
	const [bizValues, setBizValues] = useState({});
	const [createBizResponse, setCreateBizResponse] = useState({
		loading: false,
		message: "",
	});

	const { loading, message } = createBizResponse;
	const { email, password, capFirst, capLast } = loginValues;
	const {
		bizName,
		itemName,
		itemDescription,
		address,
		fullAddress,
		website,
		storeContact,
		ownerContact,
		pickUpBuffer,
		filterCategory,
		keywords,
		dietaryDescription,
		originalPrice,
		defaultPrice,
		allergens,
	} = bizValues;

	useLayoutEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	useEffect(() => {
		const tempLoginInfo = JSON.parse(getSessionStorage("tempLoginInfo"));
		const tempBizInfo = JSON.parse(getSessionStorage("tempBizInfo"));

		const { address_1, address_2, city, state, zip, country } =
			tempBizInfo.address;

		const fullAddress =
			address_1 +
			" " +
			(address_2 !== "" ? address_2 + ", " : "") +
			(city !== "" ? city + ", " : "") +
			state +
			" " +
			zip;
		tempBizInfo.fullAddress = fullAddress;

		setLoginValues(tempLoginInfo);
		setBizValues(tempBizInfo);
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setCreateBizResponse({ loading: true, message: "" });

		const lowerCaseKeywords = keywords.map((keyword) => _.toLower(keyword));
		const lowerFirstname = _.toLower(capFirst);
		const lowerLastName = _.toLower(capLast);
		const ownerNameCombination = [
			lowerFirstname,
			lowerLastName,
			lowerFirstname + " " + lowerLastName,
		];
		const newKeywords = createNameCombinations(bizName)
			.concat(lowerCaseKeywords)
			.concat(ownerNameCombination);
		const catDisplay = keywords.join(" • ");
		const capitalName = bizName
			.split(" ")
			.map((name) => _.capitalize(name))
			.join(" ");
		const lowerCaseEmail = _.toLower(email);

		// * New Business
		const businessInfo = {
			name: capitalName,
			itemName,
			itemDescription,
			status: 0,
			address: { ...address, fullAddress },
			website,
			storeContact: { ...storeContact, email: lowerCaseEmail },
			ownerContact: {
				...ownerContact,
				email: lowerCaseEmail,
				firstName: capFirst,
				lastName: capLast,
			},
			login: { email: lowerCaseEmail, password },
			createdAt: new serverTimestamp(),
			pickUpBuffer: parseInt(pickUpBuffer),
			categoryArr: keywords,
			categoryDisplay: catDisplay,
			keywords: newKeywords,
			numOrders: 0,
			numSchedules: 0,
			totalRevenue: 0,
			filterCategory,
			dietaryDescription: parseInt(dietaryDescription),
			textNumbers: {
				[ownerContact.phoneNumber]: {
					name: capFirst + " " + capLast,
					number: ownerContact.phoneNumber,
					isSelected: true,
				},
			},
			originalPrice: "$" + originalPrice,
			defaultPrice: "$" + defaultPrice,
			allergens,
			weeklySchedules: {},
			// TODO: inclue tax
			// includeTax: true,
			// version: versionNumber,
		};

		// * Default Product
		const defaultProduct = {
			itemName,
			itemDescription,
			originalPrice: "$" + originalPrice,
			defaultPrice: "$" + defaultPrice,
			allergens,
			isDefault: true,
			createdAt: new serverTimestamp(),
		};

		console.log(defaultProduct);
		console.log(businessInfo);

		// * Uncomment when testing to stop loading
		// setCreateBizResponse({
		// 	loading: false,
		// 	message,
		// });

		const bizSignUpResponse = await signUpBiz(businessInfo.login);

		if (bizSignUpResponse.success) {
			const uid = bizSignUpResponse.uid;
			businessInfo.userInfo = { uid };
			const { success, message } = await createBizAccount(
				businessInfo,
				defaultProduct,
				uid
			);
			if (success) {
				setCreateBizResponse({
					loading: false,
				});
				removeSessionStorage("tempLoginInfo");
				removeSessionStorage("tempBizInfo");
				handleNext();
			} else {
				setOpen(true);
				setCreateBizResponse({
					loading: false,
					message,
				});
			}
		} else {
			setOpen(true);
			setCreateBizResponse({
				loading: false,
				message: bizSignUpResponse.message,
			});
		}
	};

	const handlePrevPage = () => {
		handleBack();
	};

	return (
		<React.Fragment>
			<Typography variant="h5" gutterBottom>
				Review
			</Typography>
			<form onSubmit={handleSubmit}>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={12}>
						<Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
							Login Information
						</Typography>
						<Typography gutterBottom>{capFirst + " " + capLast}</Typography>
						<Typography gutterBottom>{email}</Typography>
					</Grid>
					<Grid item container direction="column" xs={12} sm={12}>
						<Typography variant="h6" gutterBottom sx={{ mt: 10 }}>
							Business Information
						</Typography>
						<Grid container>
							<Grid item xs={12}>
								<Typography gutterBottom>{fullAddress}</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography gutterBottom>
									{storeContact ? storeContact.phoneNumber : ""}
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography gutterBottom>
									{storeContact ? storeContact.email : ""}
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography gutterBottom>{website}</Typography>
							</Grid>
						</Grid>
					</Grid>
					<Grid item container direction="column" xs={12} sm={12}>
						<Typography variant="h6" gutterBottom sx={{ mt: 10 }}>
							Owner Information
						</Typography>
						<Grid container>
							<Grid item xs={12}>
								<Typography gutterBottom>
									{ownerContact ? ownerContact.phoneNumber : ""}
								</Typography>
							</Grid>
							<Grid item xs={12}>
								<Typography gutterBottom>
									{ownerContact ? ownerContact.email : ""}
								</Typography>
							</Grid>
						</Grid>
					</Grid>
					<Grid item container direction="column" xs={12} sm={12}>
						<Typography variant="h6" gutterBottom sx={{ mt: 10 }}>
							Product Details
						</Typography>
						<Grid container>
							<Grid item xs={6} mt={1}>
								<label style={{ opacity: "0.5" }}>Product name:</label>
								<Typography gutterBottom>{itemName}</Typography>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Product description:</label>
								<Typography gutterBottom>{itemDescription}</Typography>
							</Grid>
							<Grid item xs={6} mt={1}>
								<label style={{ opacity: "0.5" }}>Original price:</label>
								<Typography gutterBottom>${originalPrice}</Typography>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Default price:</label>
								<Typography gutterBottom>${defaultPrice}</Typography>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Allergens:</label>
								<Typography gutterBottom>{allergens}</Typography>
							</Grid>
						</Grid>
						<Typography variant="h6" gutterBottom sx={{ mt: 10 }}>
							Store Details
						</Typography>
						<Grid container>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>
									Buffer time: (Cut off time for orders before pick up.)
								</label>
								<Typography gutterBottom>{pickUpBuffer} minutes</Typography>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Dietary description:</label>
								<Grid item xs={12}>
									{dietaryDescription === 0
										? "None"
										: dietaryDescription === 1
										? "Vegetarian"
										: "Vegan"}
								</Grid>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Categories:</label>
								<Grid item xs={12} display="flex" gap="20px">
									{filterCategory &&
										filterCategory.map((index, idx) => {
											let categoryName;
											switch (index) {
												case 1:
													categoryName = "Meals";
													break;
												case 2:
													categoryName = "Bread & Pastries";
													break;
												case 3:
													categoryName = "Groceries";
													break;
												case 4:
													categoryName = "Other";
													break;

												default:
													break;
											}
											return (
												<Typography gutterBottom key={idx}>
													{categoryName}
												</Typography>
											);
										})}
								</Grid>
							</Grid>
							<Grid item xs={12} mt={1}>
								<label style={{ opacity: "0.5" }}>Search tags:</label>
								<Grid item xs={12} display="flex" gap="20px" flexWrap="wrap">
									{keywords &&
										keywords.map((keyword, idx) => {
											return (
												<Typography gutterBottom key={keyword}>
													{keyword}
												</Typography>
											);
										})}
								</Grid>
							</Grid>
						</Grid>
					</Grid>
					{message && (
						<Grid item xs={12} md={6}>
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
						sx={{
							display: "flex",
							justifyContent: "flex-end",
							width: "100%",
							marginTop: "10px",
						}}
					>
						{loading && (
							<Grid item xs={12} md={12}>
								<Collapse in={true}>
									<Alert severity="info">
										<p>Don&apos;t press back while loading.</p>
									</Alert>
								</Collapse>
							</Grid>
						)}
						{currentStep !== 0 && (
							<Button onClick={handlePrevPage} sx={{ mt: 3, ml: 1 }}>
								Back
							</Button>
						)}
						{loading ? (
							<CircularProgress />
						) : (
							<Button variant="contained" type="submit" sx={{ mt: 3, ml: 1 }}>
								Submit
							</Button>
						)}
					</Box>
				</Grid>
			</form>
		</React.Fragment>
	);
}
