import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import styles from "../../../styles/pages/admin/edit/slug.module.css";
import { useRouter } from "next/router";
import { categoriesD } from "../../../staticData/categoriesData";
import { states, countries } from "../../../staticData/worldLocations";
import { getBiz, updateBizUserAdmin } from "../../../actions/crud/bizUser";
import _, { first } from "lodash";
import { bufferTimes } from "../../../staticData/bufferTimes";
import { serverTimestamp } from "firebase/firestore";
import { updateSignInEmail } from "../../../actions/auth/auth";
import Admin from "../../../Components/Admin";

function Edit({ bizId, queryBizData, isLoaded, isMessage }) {
	const [bizData, setBizData] = useState({
		name: "",
		itemName: "",
		itemDescription: "",
		status: 0,
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
		pickUpBuffer: 0,
		userInfo: {},
		categoryArr: [],
		keywords: [],
		categoryDisplay: "",
	});
	const [stateArr, setStateArr] = useState([]);
	const [countryArr, setCountryArr] = useState([]);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [getBusinessMessage, setGetBusinessMessage] = useState("");

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
		categoryArr,
		pickUpBuffer,
		keywords,
		userInfo: { uid },
	} = bizData;

	useEffect(() => {
		setLoading(true);
		// * Get biz user data
		loadUser(queryBizData, isLoaded, isMessage);

		for (const [key, value] of Object.entries(states)) {
			setStateArr((prev) => [...prev, key]);
		}
		for (const [key, value] of Object.entries(countries)) {
			setCountryArr((prev) => [...prev, value]);
		}

		b; // eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryBizData, isLoaded, isMessage]);

	// * UseEffect ACTIONS
	function loadUser(data, isLoaded, isMessage) {
		const userData = data;

		const loadedKeywords = userData.keywords;
		// * nameCombination = diff combination of business name as keywords
		const nameCombination = createNameCombinations(userData.name);
		// * filter out the name combination from category keywords
		const filteredLoadedKeywords = loadedKeywords.filter(
			(keyword) => !nameCombination.includes(keyword)
		);

		if (isLoaded) {
			setLoading(false);
			setBizData({ ...userData, keywords: filteredLoadedKeywords });
		} else {
			setLoading(false);
			setGetBusinessMessage(isMessage);
		}
	}

	// * ACTIONS
	async function handleUpdateUser(e) {
		e.preventDefault();
		setLoading(true);

		// * Update biz info
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
			.concat(
				ownerNameCombination.filter(
					(ownerName) => !lowerCaseKeywords.includes(ownerName)
				)
			);
		const catDisplay = categoryArr.join(" • ");
		const capName = name
			.split(" ")
			.map((name) => _.capitalize(name))
			.join(" ");
		const capFirstName = _.capitalize(firstName);
		const capLastName = _.capitalize(lastName);

		const businessInfo = {
			name: capName,
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
			storeContact: { phoneNumber, email: loginEmail },
			ownerContact: {
				phoneNumber: ownerPhoneNumber,
				email: loginEmail,
				firstName: capFirstName,
				lastName: capLastName,
			},
			login: { email: loginEmail, password },
			// updatedAt: new serverTimestamp(),
			pickUpBuffer,
			categoryArr,
			categoryDisplay: catDisplay,
			keywords: newKeywords,
		};

		// * Check if need to update user - bizName, firstName, lastName
		let changeBizName = queryBizData.name === name ? false : true;
		let changeFirstName =
			queryBizData.ownerContact.firstName === firstName ? false : true;
		let changeLastName =
			queryBizData.ownerContact.lastName === lastName ? false : true;
		let prevFirstName = queryBizData.ownerContact.firstName;

		// TODO: Need uid to update users => {[{bizName}], firstName, lastName inviteCode}
		// TODO: Invite codes => inviteCode (id)
		// TODO: firstNames => firstNames => num (inc new/ dec old)

		// Update business user
		const { success, message } = await updateBizUserAdmin(
			uid,
			bizId,
			businessInfo,
			changeBizName,
			changeFirstName,
			changeLastName,
			prevFirstName
		);

		// Handle update user success/failure
		if (success) {
			setLoading(false);
			setMessage(message);
			setTimeout(() => {
				router.push("/admin/all");
			}, 1000);
		} else {
			setLoading(false);
			setMessage(message);
		}
	}

	function createNameCombinations(name) {
		let fullCombination;
		const lowerCaseName = _.toLower(name);
		const nameArr = lowerCaseName.split(" ");
		const nameArrLen = nameArr.length;
		const finalNameArr = nameArr.reduce(
			(acc, curr, idx) =>
				acc.concat(nameArr.slice(idx + 1).map((item) => curr + " " + item)),
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

	function handleBufferChange(e) {
		const { id } = e.target;
		const buffer = parseInt(id);
		setBizData({ ...bizData, pickUpBuffer: buffer });
	}

	function handleBufferIsChecked(time) {
		if (time == pickUpBuffer) {
			return true;
		} else {
			return false;
		}
	}

	function handleIsChecked(category) {
		// const lowerCategory = _.toLower(category);
		// const categoryIsClicked = keywords.indexOf(lowerCategory);
		const categoryIsClicked = categoryArr.indexOf(category);

		if (categoryIsClicked === -1) {
			return false;
		} else {
			return true;
		}
	}

	function handleCheckChange(category) {
		// * Add to keywords all lowercase
		const lowerCategory = _.toLower(category);
		const checkedKeywordIndex = keywords.indexOf(lowerCategory);
		const allKeywords = [...keywords];

		// * Add to cateogryArr all upper case
		const checkedCategoryIndex = categoryArr.indexOf(category);
		const allCategories = [...categoryArr];

		if (checkedKeywordIndex === -1) {
			allKeywords.push(lowerCategory);
		} else {
			allKeywords.splice(checkedKeywordIndex, 1);
		}

		if (checkedCategoryIndex === -1) {
			allCategories.push(category);
		} else {
			allCategories.splice(checkedCategoryIndex, 1);
		}

		setBizData({
			...bizData,
			keywords: allKeywords,
			categoryArr: allCategories,
		});
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
			setBizData({
				...bizData,
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
			setBizData({
				...bizData,
				address: {
					...bizData.address,
					[name]: value,
				},
			});
		} else if (name === "phoneNumber" || name === "email") {
			setBizData({
				...bizData,
				storeContact: { ...bizData.storeContact, [name]: value },
			});
		} else if (
			name === "ownerPhoneNumber" ||
			name === "ownerEmail" ||
			name === "firstName" ||
			name === "lastName"
		) {
			if (name === "ownerPhoneNumber") {
				setBizData({
					...bizData,
					ownerContact: {
						...bizData.ownerContact,
						phoneNumber: value,
					},
				});
			} else if (name === "ownerEmail") {
				setBizData({
					...bizData,
					ownerContact: { ...bizData.ownerContact, email: value },
				});
			} else {
				setBizData({
					...bizData,
					ownerContact: { ...bizData.ownerContact, [name]: value },
				});
			}
		} else if (name === "loginEmail" || name === "password") {
			if (name === "loginEmail") {
				setBizData({
					...bizData,
					login: { ...bizData.login, email: value },
				});
			} else {
				setBizData({
					...bizData,
					login: { ...bizData.login, [name]: value },
				});
			}
		}
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
				<div className={styles.Edit__fieldsetContainer}>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
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

					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="address_2">Address 2:</label>
						<input
							onChange={handleChange}
							type="text"
							name="address_2"
							id="address_2"
							value={address_2}
						/>
					</div>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label>State</label>
						{statesDropDown()}
					</div>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="country">Country:</label>
						{countryDropDown()}
					</div>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
				<div className={styles.Edit__fieldsetContainer}>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="email">Business email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="email"
							id="email"
							value={loginEmail}
							required
							disabled
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
				<div className={styles.Edit__fieldsetContainer}>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="ownerEmail">Business email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="ownerEmail"
							id="ownerEmail"
							value={loginEmail}
							required
							disabled
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
				<div className={styles.Edit__fieldsetContainer}>
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="loginEmail">Login email:</label>
						<input
							onChange={handleChange}
							type="email"
							name="loginEmail"
							id="loginEmail"
							value={loginEmail}
							required
							disabled
						/>
					</div>
					<div className={`${styles.Edit__fieldsetGroup}`}>
						<label htmlFor="password">Login password:</label>
						<input
							onChange={handleChange}
							type="password"
							name="password"
							id="password"
							value={password}
							minLength="8"
							required
							disabled
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
				<div className={styles.Edit__fieldsetCheckBoxContainer}>
					{bufferTimes.map((time, index) => {
						return (
							<div
								key={index}
								className={`${styles.Edit__fieldsetCheckBoxGroup}`}
							>
								<input
									checked={handleBufferIsChecked(time)}
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
				<div className={styles.Edit__fieldsetContainer}>
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}>
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
					<div className={`${styles.Edit__fieldsetGroup}`}></div>
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
				<div className={styles.Edit__fieldsetCheckBoxContainer}>
					<div className={styles.Edit__categories}>
						{categoriesD.sort().map((category, index) => {
							return (
								<div
									key={index}
									className={`${styles.Edit__fieldsetCheckBoxGroup}`}
								>
									<input
										checked={handleIsChecked(category)}
										onChange={() => handleCheckChange(category)}
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
				<div className={styles.Edit}>
					<button onClick={() => router.back()}>Go Back</button>
					{getBusinessMessage ? (
						<p>{getBusinessMessage}</p>
					) : (
						<div className={styles.Edit__container}>
							<form onSubmit={handleUpdateUser}>
								<fieldset className={styles.Edit__fieldset}>
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
									<button type="submit">Update Business</button>
								)}
							</form>
						</div>
					)}
				</div>
			</Admin>
		</Layout>
	);
}

export async function getServerSideProps({ res, query }) {
	const bizId = query.slug;

	const bizUserData = await getBiz(bizId);
	const data = bizUserData.docData;
	const isLoaded = bizUserData.success;
	const isMessage = bizUserData.message;

	for (const key in data) {
		if (data[key].constructor.createdAt === "Timestamp") {
			obj[key] = obj[key].toDate();
		}
	}
	const queryBizData = JSON.parse(JSON.stringify(data));

	return {
		props: {
			bizId,
			queryBizData,
			isLoaded,
			isMessage: isMessage ? isMessage : "",
		},
	};
}

export default Edit;
