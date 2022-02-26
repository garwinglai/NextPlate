import React, { useState, useEffect } from "react";
import Layout from "../../Components/Layout";
import styles from "../../styles/pages/admin/create.module.css";
import { states, countries } from "../../staticData/worldLocations";
import createBizUser from "../../actions/crud/bizUser";
import { signUpBiz } from "../../actions/auth/auth";
import { serverTimestamp } from "firebase/firestore";
import _ from "lodash";
import { categoriesD } from "../../staticData/categoriesData";
import { useRouter } from "next/router";
import { bufferTimes } from "../../staticData/bufferTimes";
import Admin from "../../Components/Admin";

function Create() {
	const [newBusinessUser, setNewBusinessUser] = useState({
		name: "",
		itemName: "Mystery Bag",
		itemDescription: "",
		status: 1,
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
			email: "",
		},
		ownerContact: {
			phoneNumber: "",
			email: "",
			firstName: "",
			lastName: "",
		},
		login: {
			email: "",
			password: "",
		},
		createdAt: "",
		pickUpBuffer: 30,
		categoryArr: [],
		keywords: [],
		categoryDisplay: "",
	});
	const [stateArr, setStateArr] = useState([]);
	const [countryArr, setCountryArr] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const router = useRouter();

	const {
		name,
		itemName,
		itemDescription,
		status,
		address: { address_1, address_2, city, state, zip, country },
		website,
		storeContact: { phoneNumber, email },
		ownerContact: {
			phoneNumber: ownerPhoneNumber,
			email: ownerEmail,
			firstName,
			lastName,
		},
		login: { email: loginEmail, password },
		pickUpBuffer,
		keywords,
	} = newBusinessUser;

	useEffect(() => {
		for (const [key, value] of Object.entries(states)) {
			setStateArr((prev) => [...prev, key]);
		}
		for (const [key, value] of Object.entries(countries)) {
			setCountryArr((prev) => [...prev, value]);
		}
	}, []);

	// * ACTIONS

	async function handleNewUser(e) {
		e.preventDefault();
		setLoading(true);

		const lowerCaseKeywords = keywords.map((keyword) => _.toLower(keyword));
		const lowerFirstname = _.toLower(firstName);
		const lowerLastName = _.toLower(lastName);
		const ownerNameCombination = [
			lowerFirstname,
			lowerLastName,
			lowerFirstname + " " + lowerLastName,
		];
		const newKeywords = createNameCombinations(name)
			.concat(lowerCaseKeywords)
			.concat(ownerNameCombination);
		const catDisplay = keywords.join(" • ");
		const capitalName = name
			.split(" ")
			.map((name) => _.capitalize(name))
			.join(" ");

		const businessInfo = {
			name: capitalName,
			itemName,
			itemDescription,
			status,
			address: {
				fullAddress:
					address_1 +
					" " +
					(address_2 !== "" ? address_2 + ", " : "") +
					(city !== "" ? city + ", " : "") +
					state +
					" " +
					zip,
				address_1,
				address_2,
				city,
				state,
				zip,
				country,
			},
			website,
			storeContact: { phoneNumber, email },
			ownerContact: {
				phoneNumber: ownerPhoneNumber,
				email: ownerEmail,
				firstName,
				lastName,
			},
			login: { email: loginEmail, password },
			createdAt: new serverTimestamp(),
			pickUpBuffer,
			categoryArr: keywords,
			categoryDisplay: catDisplay,
			keywords: newKeywords,
			numOrders: 0,
		};

		const bizSignUpResponse = await signUpBiz(businessInfo.login);

		if (bizSignUpResponse.success) {
			const uid = bizSignUpResponse.uid;
			const createBizResponse = await createBizUser(businessInfo, uid);
			if (createBizResponse.success) {
				setLoading(false);
				setMessage(createBizResponse.message);
				setTimeout(() => {
					router.push("/admin");
				}, 1000);
			} else {
				setLoading(false);
				setMessage(createBizResponse.message);
			}
		} else {
			setLoading(false);
			setMessage(bizSignUpResponse.message);
		}
	}

	function createNameCombinations(name) {
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
	}

	function handleChange(e) {
		const { name, value } = e.target;

		if (
			name === "name" ||
			name === "website" ||
			name === "status" ||
			name === "itemName" ||
			name === "itemDescription"
		) {
			setNewBusinessUser({
				...newBusinessUser,
				[name]: value,
			});
		} else if (
			name === "address_1" ||
			name === "address_2" ||
			name === "city" ||
			name === "state" ||
			name === "zip" ||
			name === "country"
		) {
			setNewBusinessUser({
				...newBusinessUser,
				address: {
					...newBusinessUser.address,
					[name]: value,
				},
			});
		} else if (name === "phoneNumber" || name === "email") {
			setNewBusinessUser({
				...newBusinessUser,
				storeContact: { ...newBusinessUser.storeContact, [name]: value },
			});
		} else if (
			name === "ownerPhoneNumber" ||
			name === "ownerEmail" ||
			name === "firstName" ||
			name === "lastName"
		) {
			if (name === "ownerPhoneNumber") {
				setNewBusinessUser({
					...newBusinessUser,
					ownerContact: {
						...newBusinessUser.ownerContact,
						phoneNumber: value,
					},
				});
			} else if (name === "ownerEmail") {
				setNewBusinessUser({
					...newBusinessUser,
					ownerContact: { ...newBusinessUser.ownerContact, email: value },
				});
			} else {
				setNewBusinessUser({
					...newBusinessUser,
					ownerContact: { ...newBusinessUser.ownerContact, [name]: value },
				});
			}
		} else if (name === "loginEmail" || name === "password") {
			if (name === "loginEmail") {
				setNewBusinessUser({
					...newBusinessUser,
					login: { ...newBusinessUser.login, email: value },
				});
			} else {
				setNewBusinessUser({
					...newBusinessUser,
					login: { ...newBusinessUser.login, [name]: value },
				});
			}
		}
	}

	function handleCheckChange(e) {
		const { name, checked } = e.target;

		if (checked) {
			setNewBusinessUser({
				...newBusinessUser,
				keywords: [...newBusinessUser.keywords, name],
			});
		} else if (!checked) {
			setNewBusinessUser({
				...newBusinessUser,
				keywords: keywords.filter((keyword) => keyword !== name),
			});
		}
	}

	function handleBufferChange(e) {
		const { id } = e.target;
		const buffer = parseInt(id);
		setNewBusinessUser({ ...newBusinessUser, pickUpBuffer: buffer });
	}

	// * DISPLAYS
	function statesDropDown() {
		return (
			<select name="state" value={state} onChange={handleChange} required>
				<option value="null">Select state:</option>
				{stateArr.map((mapState, i) => {
					return (
						<option key={i} value={mapState}>
							{mapState}
						</option>
					);
				})}
			</select>
		);
	}

	function countryDropDown() {
		return (
			<select name="country" value={country} onChange={handleChange} required>
				<option value="null">Select country:</option>
				{countryArr.map((mapCountry, i) => {
					return (
						<option value={mapCountry} key={i}>
							{mapCountry}
						</option>
					);
				})}
			</select>
		);
	}

	function bizInfo() {
		return (
			<>
				<legend>
					<h4>Business Information</h4>
				</legend>
				<div className={styles.Create__fieldsetContainer}>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="name">Business name:</label>
						<input
							onChange={handleChange}
							type="text"
							id="name"
							name="name"
							value={name}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="status">Status:</label>
						<input
							onChange={handleChange}
							type="number"
							id="status"
							name="status"
							value={status}
							required
						/>
					</div>

					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="address_1">Address 1:</label>
						<input
							onChange={handleChange}
							type="text"
							id="address_1"
							name="address_1"
							value={address_1}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="address_2">Address 2:</label>
						<input
							onChange={handleChange}
							type="text"
							name="address_2"
							id="address_2"
							value={address_2}
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="city">City:</label>
						<input
							onChange={handleChange}
							type="text"
							name="city"
							id="city"
							value={city}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label>State</label>
						{statesDropDown()}
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="zip">Zip:</label>
						<input
							onChange={handleChange}
							type="text"
							pattern="[0-9]*"
							name="zip"
							id="zip"
							value={zip}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="country">Country:</label>
						{countryDropDown()}
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="website">Website url:</label>
						<input
							onChange={handleChange}
							type="url"
							name="website"
							id="website"
							value={website}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="fullAddress">Full Address:</label>
						<p id="fullAddress" style={{ marginTop: "5px" }}>
							{address_1 +
								" " +
								(address_2 !== "" ? address_2 + ", " : "") +
								(city !== "" ? city + ", " : "") +
								state +
								" " +
								zip}
						</p>
					</div>
				</div>
			</>
		);
	}

	function storeContact() {
		return (
			<>
				<legend>
					<h4>Store Contact Information</h4>
				</legend>
				<div className={styles.Create__fieldsetContainer}>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="phoneNumber">Phone number:</label>
						<input
							onChange={handleChange}
							type="tel"
							name="phoneNumber"
							id="phoneNumber"
							value={phoneNumber}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="email">Business email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="email"
							id="email"
							value={email}
							required
						/>
					</div>
				</div>
			</>
		);
	}

	function ownerInfo() {
		return (
			<>
				<legend>
					<h4>Owner Information</h4>
				</legend>
				<div className={styles.Create__fieldsetContainer}>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="firstName">First Name:</label>
						<input
							onChange={handleChange}
							type="text"
							name="firstName"
							id="firstName"
							value={firstName}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="lastName">Last Name:</label>
						<input
							onChange={handleChange}
							type="text"
							name="lastName"
							id="lastName"
							value={lastName}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="ownerPhoneNumber">Phone number:</label>
						<input
							onChange={handleChange}
							type="tel"
							name="ownerPhoneNumber"
							id="ownerPhoneNumber"
							value={ownerPhoneNumber}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="ownerEmail">Business email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="ownerEmail"
							id="ownerEmail"
							value={ownerEmail}
							required
						/>
					</div>
				</div>
			</>
		);
	}

	function loginInfo() {
		return (
			<>
				<legend>
					<h4>Login Information</h4>
				</legend>
				<div className={styles.Create__fieldsetContainer}>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="loginEmail">Login email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="loginEmail"
							id="loginEmail"
							value={loginEmail}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="password">Login password:</label>
						<input
							onChange={handleChange}
							type="password"
							name="password"
							id="password"
							value={password}
							minLength="8"
							required
						/>
					</div>
				</div>
			</>
		);
	}

	function showPickUpBuffer() {
		return (
			<>
				<legend>
					<h4>Pick Up Buffer</h4>
				</legend>
				<div className={styles.Create__fieldsetCheckBoxContainer}>
					{bufferTimes.map((time, index) => {
						return (
							<div
								key={index}
								className={`${styles.Create__fieldsetCheckBoxGroup}`}
							>
								<input
									onChange={handleBufferChange}
									type="radio"
									id={time}
									name="pickUpBuffer"
									required
								/>
								<label htmlFor={time}>{`${time} min`}</label>
							</div>
						);
					})}
				</div>
			</>
		);
	}

	function showProductDescriptions() {
		let wordCount = itemDescription ? itemDescription.length : 0;
		return (
			<>
				<legend>
					<h4>Product Information</h4>
				</legend>
				<div className={styles.Create__fieldsetContainer}>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="itemName">Item name:</label>
						<input
							onChange={handleChange}
							type="text"
							name="itemName"
							id="itemName"
							value={itemName}
							required
						/>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}>
						<label htmlFor="itemDescription">Item description:</label>
						<textarea
							onChange={handleChange}
							rows={3}
							type="textarea"
							name="itemDescription"
							id="itemDescription"
							value={itemDescription}
							maxLength={350}
							required
						/>
						<p style={{ textAlign: "right" }}>{wordCount} / 350</p>
					</div>
					<div className={`${styles.Create__fieldsetGroup}`}></div>
				</div>
			</>
		);
	}

	function categories() {
		return (
			<>
				<legend>
					<h4>Categories </h4>
					<p style={{ marginTop: "10px" }}>* Select all that apply.</p>
				</legend>
				<div className={styles.Create__fieldsetCheckBoxContainer}>
					<div className={styles.Create__categories}>
						{categoriesD.sort().map((category, index) => {
							return (
								<div
									key={index}
									className={`${styles.Create__fieldsetCheckBoxGroup}`}
								>
									<input
										onChange={handleCheckChange}
										type="checkbox"
										id={category}
										name={category}
									/>
									<label htmlFor={category}>{category}</label>
								</div>
							);
						})}
					</div>
				</div>
			</>
		);
	}

	return (
		<Layout currentPage="admin">
			<Admin>
				<div className={styles.Create}>
					<div>
						<form onSubmit={handleNewUser}>
							<fieldset className={styles.Create__fieldset}>
								<legend>
									<h2>Create New Business</h2>
								</legend>
								{bizInfo()}
								{storeContact()}
								{ownerInfo()}
								{loginInfo()}
								{showPickUpBuffer()}
								{showProductDescriptions()}
								{categories()}
							</fieldset>
							{message && <p style={{ marginBottom: "10px" }}>{message}</p>}
							{loading ? (
								<p>Loading...</p>
							) : (
								<button type="submit">Create New Business</button>
							)}
						</form>
					</div>
				</div>
			</Admin>
		</Layout>
	);
}

export default Create;
