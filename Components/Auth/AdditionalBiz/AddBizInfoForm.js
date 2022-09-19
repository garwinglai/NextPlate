import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { states, countries } from "../../../staticData/worldLocations";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";
import {
	categoriesD,
	filterCategoryArr,
	dietary,
} from "../../../staticData/categoriesData";
import {
	getSessionStorage,
	setSessionStorage,
} from "../../../actions/auth/auth";
import PhoneInput from "react-phone-input-2";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import CurrencyInput from "react-currency-input-field";
import styles from "../../../styles/components/auth/additionalbiz/addbizinfoform.module.css";

export default function AddBizInfoForm({
	currentStep,
	stepsArray,
	handleNext,
	handleBack,
	bizContact,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [handling, setHandling] = useState({ message: "" });
	const [stateArr, setStateArr] = useState([]);
	const [countryArr, setCountryArr] = useState([]);
	const [categoriesArrOne, setCategoriesArrOne] = useState([]);
	const [categoriesArrTwo, setCategoriesArrTwo] = useState([]);
	const [bizValues, setBizValues] = useState({
		bizName: "",
		itemName: "Surprise Item",
		itemDescription:
			"Let's fight food waste together! Come try our mystery surprise item!",
		address: {
			fullAddress: "",
			address_1: "",
			address_2: "",
			city: "",
			state: "",
			zip: "",
			country: "",
		},
		website: "",
		storeContact: {
			phoneNumber: "",
			email: bizContact.email,
		},
		ownerContact: {
			phoneNumber: `1${bizContact.phoneNumber}`,
			email: bizContact.email,
		},
		pickUpBuffer: 0,
		keywords: [],
		filterCategory: [],
		dietaryDescription: 0,
		textNumbers: {},
		originalPrice: "13.99",
		defaultPrice: "7.99",
		allergens: "",
	});

	const { message } = handling;
	const {
		bizName,
		itemName,
		itemDescription,
		address: { address_1, address_2, city, state, zip, country },
		website,
		storeContact: { phoneNumber, email },
		ownerContact: { phoneNumber: ownerPhoneNumber, email: ownerEmail },
		pickUpBuffer,
		keywords,
		filterCategory,
		dietaryDescription,
		textNumbers,
		originalPrice,
		defaultPrice,
		allergens,
	} = bizValues;

	useEffect(() => {
		const tempLoginInfo = JSON.parse(getSessionStorage("tempLoginInfo"));
		const tempBizInfo = JSON.parse(getSessionStorage("tempBizInfo"));

		if (tempBizInfo) {
			const storeNum = "1" + tempBizInfo.storeContact.phoneNumber;
			const ownerNum = "1" + tempBizInfo.ownerContact.phoneNumber;
			const emailTemp = tempBizInfo.ownerContact.email;

			setBizValues((prev) => ({
				...prev,
				...tempBizInfo,
				storeContact: {
					...prev.storeContact,
					phoneNumber: storeNum,
				},
				ownerContact: {
					...prev.ownerContact,
					phoneNumber: ownerNum,
					email: emailTemp,
				},
			}));
		}

		for (const [key, value] of Object.entries(states)) {
			setStateArr((prev) => [...prev, key]);
		}
		for (const [key, value] of Object.entries(countries)) {
			setCountryArr((prev) => [...prev, value]);
		}

		// * Split up categories into 2 arrays in loop in display
		const catLen = categoriesD.length;
		const sortedCat = categoriesD.sort();
		const calculateHalf = Math.ceil(catLen / 2);

		const oneHalfCat = sortedCat.slice(0, calculateHalf);
		const secondHalfCat = sortedCat.slice(calculateHalf);

		oneHalfCat.map((cat) => setCategoriesArrOne((prev) => [...prev, cat]));
		secondHalfCat.map((cat) => setCategoriesArrTwo((prev) => [...prev, cat]));
	}, []);

	// * Actions ------------------------------------------------------------------
	const handleNextPage = (e, bizValues) => {
		e.preventDefault();
		const capAddress_1 = address_1
			.split(" ")
			.map((item) => _.capitalize(item))
			.join(" ");
		const capAddress_2 = _.capitalize(address_2);
		const capCity = city
			.split(" ")
			.map((item) => _.capitalize(item))
			.join(" ");

		if (phoneNumber.length !== 11) {
			setHandling({
				message: "Phone numbers must include +1 area code.",
			});
			setIsOpen(true);
			return;
		}

		if (ownerPhoneNumber[0] !== "1" || phoneNumber[0] !== "1") {
			setHandling({
				message:
					"Phone numbers must include +1 area code. We currently only provide service in the United States.",
			});
			setIsOpen(true);
			return;
		}

		const ownerNumNoSpaceChar = ownerPhoneNumber.slice(1);
		const phoneNumNoSpaceChar = phoneNumber.slice(1);
		const capFirst = _.capitalize(bizContact.firstName);
		const capLast = _.capitalize(bizContact.lastName);

		setSessionStorage("tempLoginInfo", {
			capFirst,
			capLast,
			email: bizContact.email,
			password: bizContact.password,
		});

		setSessionStorage("tempBizInfo", {
			...bizValues,
			address: {
				address_1: capAddress_1,
				address_2: capAddress_2,
				city: capCity,
				state,
				zip,
				country,
			},
			ownerContact: {
				...bizValues.ownerContact,
				phoneNumber: ownerNumNoSpaceChar,
			},
			storeContact: {
				...bizValues.storeContact,
				phoneNumber: phoneNumNoSpaceChar,
			},
		});
		handleNext();
	};

	const handlePrevPage = () => {
		handleBack();
	};

	const handleChange = (e, val) => {
		let name;
		let value;

		if (val === "phoneNumber") {
			name = val;
			value = e;
		} else {
			name = e.target.name;
			value = e.target.value;
		}

		if (name === "bizName" || name === "website") {
			setBizValues((prev) => ({
				...prev,
				[name]: value,
			}));
		}

		if (
			name === "address_1" ||
			name === "address_2" ||
			name === "city" ||
			name === "state" ||
			name === "zip" ||
			name === "country"
		) {
			setBizValues((prev) => ({
				...prev,
				address: { ...prev.address, [name]: value },
			}));
		}

		if (name === "phoneNumber") {
			const noHypenSpaceNumber = value
				.split("")
				.filter((item) => item !== "-")
				.filter((item) => item !== " ")
				.join("");

			setBizValues((prev) => ({
				...prev,
				storeContact: {
					...prev.storeContact,
					phoneNumber: noHypenSpaceNumber,
				},
			}));
		}
	};

	const handleFilterCategoryChange = (e) => {
		const { name, checked } = e.target;

		let filterIndex;

		switch (name) {
			case "Meals":
				filterIndex = 1;
				break;
			case "Bread & Pastries":
				filterIndex = 2;
				break;
			case "Groceries":
				filterIndex = 3;
				break;
			case "Other":
				filterIndex = 4;
				break;

			default:
				break;
		}

		if (checked) {
			setBizValues((prev) => ({
				...prev,
				filterCategory: [...prev.filterCategory, filterIndex],
			}));
		} else if (!checked) {
			setBizValues((prev) => ({
				...prev,
				filterCategory: filterCategory.filter((index) => index !== filterIndex),
			}));
		}
	};

	const handleIsCheckedFilterCategory = (category) => {
		let filterIndex;

		switch (category) {
			case "Meals":
				filterIndex = 1;
				break;
			case "Bread & Pastries":
				filterIndex = 2;
				break;
			case "Groceries":
				filterIndex = 3;
				break;
			case "Other":
				filterIndex = 4;
				break;

			default:
				break;
		}

		const isChecked = filterCategory.includes(filterIndex);

		if (isChecked) {
			return true;
		}

		return false;
	};

	const handleCheckChange = (e) => {
		const { name, checked } = e.target;

		if (checked) {
			setBizValues((prev) => ({
				...prev,
				keywords: [...prev.keywords, name],
			}));
		} else if (!checked) {
			setBizValues((prev) => ({
				...prev,
				keywords: keywords.filter((keyword) => keyword !== name),
			}));
		}
	};

	const handleIsChecked = (category) => {
		const isChecked = keywords.includes(category);

		if (isChecked) {
			return true;
		}

		return false;
	};

	return (
		<React.Fragment>
			<div className={`${styles.AddBizInfoForm}`}>
				<form onSubmit={(e) => handleNextPage(e, bizValues)}>
					<Typography variant="h6" gutterBottom>
						Business Information
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} sm={12}>
							<input
								autoFocus
								required
								type="text"
								id="bizName"
								name="bizName"
								value={bizName}
								placeholder="* Business name"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12}>
							<input
								required
								type="text"
								id="address_1"
								name="address_1"
								value={address_1}
								placeholder="* Address line 1"
								autoComplete="shipping address-line1"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12}>
							<input
								type="text"
								id="address_2"
								name="address_2"
								value={address_2}
								placeholder="Address line 2"
								autoComplete="shipping address-line2"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<input
								required
								type="text"
								id="city"
								name="city"
								value={city}
								placeholder="* City"
								autoComplete="shipping address-level2"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<select
								required
								id="state"
								name="state"
								autoComplete="shipping state"
								onChange={handleChange}
								value={state}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							>
								<option value="">Select a state/province/region:</option>;
								{stateArr.map((mapState, i) => {
									return (
										<option key={i} value={mapState}>
											{mapState}
										</option>
									);
								})}
							</select>
						</Grid>
						<Grid item xs={12} sm={6}>
							<input
								required
								id="zip"
								name="zip"
								value={zip}
								placeholder="* Zip code"
								autoComplete="shipping postal-code"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<select
								required
								id="country"
								name="country"
								value={country}
								autoComplete="shipping country"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							>
								<option value="">Select a country:</option>
								{countryArr.map((mapCountry, i) => {
									return (
										<option value={mapCountry} key={i}>
											{mapCountry}
										</option>
									);
								})}
							</select>
						</Grid>
					</Grid>
					<Typography variant="h6" gutterBottom mt={5}>
						Business Contact
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} sm={12}>
							<PhoneInput
								required
								type="tel"
								id="phoneNumber"
								name="phoneNumber"
								country="us"
								value={phoneNumber}
								placeholder="* Business phone"
								specialLabel=""
								onChange={(e) => handleChange(e, "phoneNumber")}
								inputStyle={{
									width: "100%",
									textIndent: "5px",
									height: "40px",
								}}
							/>
						</Grid>
						<Grid item xs={12}>
							<input
								required
								disabled
								type="email"
								id="email"
								name="email"
								value={email}
								placeholder="* Business email"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
						<Grid item xs={12}>
							<input
								type="url"
								id="website"
								name="website"
								value={website}
								placeholder="Website"
								onChange={handleChange}
								style={{ width: "100%", textIndent: "5px", height: "40px" }}
							/>
						</Grid>
					</Grid>

					<Grid container spacing={3}>
						<Grid item xs={12} sm={12} mt={5}>
							<Typography variant="h6" gutterBottom mb={1}>
								Store Details
							</Typography>
							<FormLabel id="demo-row-radio-buttons-group-label">
								Dietary description
							</FormLabel>
							<RadioGroup
								required
								row
								aria-labelledby="demo-row-radio-buttons-group-label"
								name="dietaryDescription"
								value={dietaryDescription}
								onChange={handleChange}
							>
								<FormControlLabel value={0} control={<Radio />} label="None" />

								<FormControlLabel
									value={1}
									control={<Radio />}
									label="Vegetarian"
								/>
								<FormControlLabel value={2} control={<Radio />} label="Vegan" />
							</RadioGroup>
						</Grid>
						<Grid item xs={12} sm={12} mt={1}>
							<FormLabel component="legend">Category</FormLabel>
							<label style={{ fontSize: "12px", opacity: "0.6" }}>
								* Choose all that applies
							</label>
							<Box
								mt={2}
								mb={3}
								display="flex"
								gap="40px"
								flexWrap="wrap"
								padding="0 5px 0 5px"
							>
								{filterCategoryArr.map((item, idx) => {
									return (
										<div
											key={item}
											style={{
												transform: "scale(1.1)",
												display: "flex",
												alignItems: "center",
											}}
										>
											<input
												type="checkbox"
												id={item}
												name={item}
												onChange={handleFilterCategoryChange}
												checked={handleIsCheckedFilterCategory(item)}
												style={{
													marginRight: "5px",
												}}
											/>
											<label
												htmlFor={item}
												style={{ opacity: "0.8", fontSize: "14px" }}
											>
												{item}
											</label>
										</div>
									);
								})}
							</Box>
						</Grid>
						<Grid item xs={12} sm={12}>
							<FormLabel component="legend">Search tags</FormLabel>
							<label style={{ fontSize: "12px", opacity: "0.6" }}>
								* Choose all that applies
							</label>
							<Box
								mt={2}
								sx={{
									display: "flex",
									justifyContent: "space-evenly",
									gap: "50px",
									height: "507px",
									overflowY: "scroll",
									border: "1px solid var(--light-gray)",
									padding: "10px",
								}}
							>
								<div>
									{categoriesArrOne.map((cat, idx) => {
										return (
											<div
												key={cat}
												style={{
													transform: "scale(1.1)",
													display: "flex",
													alignItems: "center",
													marginBottom: "10px",
												}}
											>
												<input
													type="checkbox"
													id={cat}
													name={cat}
													onChange={handleCheckChange}
													checked={handleIsChecked(cat)}
													style={{
														marginRight: "5px",
													}}
												/>
												<label
													htmlFor={cat}
													style={{ opacity: "0.8", fontSize: "14px" }}
												>
													{cat}
												</label>
											</div>
										);
									})}
								</div>
								<div>
									{categoriesArrTwo.map((cat, idx) => {
										return (
											<div
												key={cat}
												style={{
													transform: "scale(1.1)",
													display: "flex",
													alignItems: "center",
													marginBottom: "10px",
												}}
											>
												<input
													type="checkbox"
													id={cat}
													name={cat}
													onChange={handleCheckChange}
													checked={handleIsChecked(cat)}
													style={{ marginRight: "5px" }}
												/>
												<label
													htmlFor={cat}
													style={{ opacity: "0.8", fontSize: "14px" }}
												>
													{cat}
												</label>
											</div>
										);
									})}
								</div>
							</Box>
						</Grid>
					</Grid>
					{message && (
						<Grid item xs={12} md={12}>
							<Collapse in={isOpen}>
								<Alert
									severity="error"
									onClose={() => {
										setIsOpen(false);
									}}
									sx={{ mt: 3 }}
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

						<Button variant="contained" type="submit" sx={{ mt: 3, ml: 1 }}>
							Next
						</Button>
					</Box>
				</form>
			</div>
		</React.Fragment>
	);
}
