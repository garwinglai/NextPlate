import React, { useState, useEffect } from "react";
import Admin from "../../Components/Admin";
import Layout from "../../Components/Layout";
import {
	collection,
	getDocs,
	getDoc,
	doc,
	query,
	orderBy,
	writeBatch,
	serverTimestamp,
	deleteDoc,
	where,
	limit,
	limitToLast,
	endBefore,
	updateDoc,
	endAt,
	startAfter,
	setDoc,
	deleteField,
} from "firebase/firestore";
import { db, incrementArgs } from "../../firebase/fireConfig";

function AllUsers() {
	const [userValues, setUserValues] = useState({
		numUsers: 0,
		newUsers: 0,
		lastPullDate: "",
		loading: false,
		errorMessage: "",
	});

	const adminId = "6IUWvD23ayVkRlxaO2wtSM2faNB3";
	const { numUsers, newUsers, lastPullDate, loading, errorMessage } =
		userValues;

	const handleClickGetUsers = async () => {
		const data = await getLastPullUserDate(adminId);
		const lastPullUserDate = data.lastPullUserDate;
		const lastPullUserDateShort = data.lastPullUserDateShort;
		const previousUsers = data.totalUsers;

		if (lastPullUserDate) {
			const userDocRef = collection(db, "users");
			const queryUser = query(
				userDocRef,
				where("createdAt", ">", lastPullUserDate)
			);

			try {
				const userSnapshot = await getDocs(queryUser);
				const size = userSnapshot.size;

				// save new date to lastpulluser
				// Show new user since lastPullUserDate
				// Show previous user
				// Show totalUsers
				// Add to totalUsers

				const resUpdateAdmin = await updateAdminUserCount(adminId, size);

				setUserValues((prev) => ({
					...prev,
					numUsers: previousUsers,
					newUsers: size,
					lastPullDate: lastPullUserDateShort,
				}));
			} catch (error) {
				console.log("error getting users admin count", error);
			}
		}
	};

	const updateAdminUserCount = async (adminId, size) => {
		const adminDocRef = doc(db, "admin", adminId);
		const date = new Date();
		const dateEpoch = Date.parse(date);
		const dateShort = date.toLocaleDateString();
		try {
			await updateDoc(adminDocRef, {
				lastPullUserDate: dateEpoch,
				lastPullUserDateShort: dateShort,
				totalUsers: incrementArgs(size),
			});
		} catch (error) {}
	};

	const getLastPullUserDate = async (adminId) => {
		const adminDocRef = doc(db, "admin", adminId);
		try {
			const adminSnapshot = await getDoc(adminDocRef);
			const data = adminSnapshot.data();

			return data;
		} catch (error) {
			console.log("error pulling admin", error);
			return null;
		}
	};

	return (
		<Layout currentPage="admin">
			<Admin>
				<div>
					<button onClick={handleClickGetUsers}>Get Users</button>
					<div
						style={{
							display: "flex",
							gap: "20px",
							marginLeft: "50px",
							marginTop: "50px",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column" }}>
							<p>
								Number of users before {lastPullDate}: {numUsers}
							</p>
							<p>
								New users since {lastPullDate}: {newUsers}
							</p>
							<p>Total users: {numUsers + newUsers}</p>
						</div>
					</div>
				</div>
			</Admin>
		</Layout>
	);
}

export default AllUsers;
