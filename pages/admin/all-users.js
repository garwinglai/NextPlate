import React, { useState, useEffect } from "react";
import Admin from "../../Components/Admin";
import Layout from "../../Components/Layout";
import getAllUsers from "../../actions/crud/user";
import { CircularProgress } from "@mui/material";

function AllUsers() {
	const [userValues, setUserValues] = useState({
		numUsers: 0,
		loading: false,
		errorMessage: "",
	});

	const { numUsers, loading, errorMessage } = userValues;

	useEffect(() => {
		loadUsers();
	}, []);

	async function loadUsers() {
		setUserValues((prev) => ({ ...prev, loading: true }));
		const resUsers = await getAllUsers();
		const { success, message, users } = resUsers;
		console.log("users", users);

		if (success) {
			setUserValues((prev) => ({
				...prev,
				loading: false,
				numUsers: users,
			}));
		} else {
			setUserValues((prev) => ({
				...prev,
				loading: false,
				errorMessage: message,
			}));
		}
	}

	return (
		<Layout currentPage="admin">
			<Admin>
				<div>
					<h5>Users</h5>
					<p>{numUsers}</p>
				</div>
			</Admin>
		</Layout>
	);
}

export default AllUsers;
