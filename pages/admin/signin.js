import React, { useState, useEffect } from "react";
import Layout from "../../Components/Layout";
import { useRouter } from "next/router";
import { isAuth, signInAdmin } from "../../actions/auth/auth";

function Signin() {
	const [adminLoginCred, setAdminLoginCred] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const router = useRouter();

	const { email, password } = adminLoginCred;

	useEffect(() => {
		if (!isAuth()) {
			router.push("/admin/signin");
		} else {
			router.push("/admin");
		}
	}, [router]);

	async function handleClick(e) {
		e.preventDefault();
		setLoading(true);

		let signInAdminRes = await signInAdmin(adminLoginCred);
		if (signInAdminRes.success) {
			router.push("/admin");
		} else {
			setLoading(false);
			setMessage(signInAdminRes.message);
		}
	}

	function handleChange(e) {
		const { name, value } = e.target;
		setMessage("");
		setLoading(false);
		setAdminLoginCred((prev) => ({ ...prev, [name]: value }));
	}
	return (
		<Layout currentPage="admin">
			<h2>Admin Sign In</h2>
			<form onSubmit={handleClick}>
				<div>
					<input
						onChange={handleChange}
						value={email}
						type="email"
						name="email"
						id="email"
						required
					/>
					<label htmlFor="email">Admin email</label>
				</div>
				<div>
					<input
						onChange={handleChange}
						value={password}
						type="password"
						name="password"
						minLength="8"
						id="password"
						required
					/>
					<label htmlFor="password">Admin password</label>
				</div>
				{loading ? (
					<p>Loading...</p>
				) : (
					<button name="signin" type="submit">
						Sign in
					</button>
				)}
				{message && JSON.stringify(message)}
			</form>
		</Layout>
	);
}

export default Signin;
