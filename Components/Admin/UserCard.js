import React, { useState, useEffect } from "react";
import styles from "../../styles/components/admin/user-card.module.css";
import { useRouter } from "next/router";
import { deleteBizUser } from "../../actions/crud/bizUser";

function UserCard({ data }) {
	const [businessUserData, setBusinessUserData] = useState({
		bizId: "",
		name: "",
		status: 0,
		fullAddress: "",
		website: "",
		storePhone: "",
		ownerPhone: "",
		lName: "",
		fName: "",
		loginEmail: "",
		createdAtDate: "",
		totalRevenue: 0,
		pickUpBuffer: 30,
	});

	const {
		name,
		status,
		fullAddress,
		website,
		fName,
		lName,
		storePhone,
		ownerPhone,
		loginEmail,
		createdAtDate,
		createdAtTime,
		totalRevenue,
	} = businessUserData;

	const route = useRouter();
	const [bizData, bizId] = data;

	useEffect(() => {
		setBusinessUserData({
			bizId,
			name: bizData.name,
			status: bizData.status,
			fullAddress: bizData.address.fullAddress,
			website: bizData.website,
			fName: bizData.ownerContact.firstName,
			lName: bizData.ownerContact.lastName,
			storePhone: bizData.storeContact.phoneNumber,
			ownerPhone: bizData.storeContact.phoneNumber,
			loginEmail: bizData.login.email,
			pickUpBuffer: bizData.pickUpBuffer,
			totalRevenue: bizData.totalRevenue,
			// createdAtDate: bizData.createdAt.toDate().toLocaleDateString("en-US"),
			// createdAtTime: bizData.createdAt.toDate().toLocaleTimeString(),
		});
	}, [bizData, bizId]);

	async function handleClick(e) {
		const { name } = e.target;
		if (name === "edit") {
			route.push(`/admin/edit/${bizId}`);
		}

		// TODO: Handle delete, then clear out the page
		// else if (name === "delete") {
		// 	//handle delete
		// 	setLoading(true);
		// 	const { success, message } = await deleteBizUser(bizId);
		// 	if (success) {
		// 		setLoading(false);
		// 		setMessage({ success: message, failure: "" });
		// 	} else if (!success) {
		// 		setLoading(false);
		// 		setMessage({ failure: message, success: "" });
		// 	}
		// }
	}

	return (
		<div className={styles.UserCard}>
			<div className={styles.UserCardContainer}>
				<div className={styles.UserCard_left}>
					<p>
						<b>Business Name:</b> {name}
					</p>
					<p>
						<b>Owner Name:</b> {`${fName} ${lName} `}
					</p>
					<p>
						<b>Address:</b> {fullAddress}
					</p>
					<p>
						<b>Website:</b> {website}
					</p>
					<p>
						<b>Status:</b> {status}
					</p>
				</div>
				<div className={styles.UserCard_mid}>
					<p>
						<b>Login Email:</b> {loginEmail}
					</p>
					<p>
						<b>Store Phone:</b> {storePhone}
					</p>
					<p>
						<b>Owner Phone:</b> {ownerPhone}
					</p>
					<p>
						<b>Created At Date: </b>
						{createdAtDate}
					</p>
					<p>
						<b>Total Revenue </b>${totalRevenue}
					</p>
				</div>
				<div className={styles.UserCard_right}>
					<button onClick={handleClick} name="edit">
						Edit
					</button>
					{/* <button onClick={handleClick} name="delete">
						{loading ? "Loading" : "Delete"}
					</button> */}
				</div>
			</div>
		</div>
	);
}

export default UserCard;
