import React, { useState } from "react";
import Layout from "../../Components/Layout";
import { useRouter } from "next/router";
import { signUpAdmin } from "../../actions/auth/auth";
import {
	addAdminEmails,
	addEmailsInUse,
	addAdminEmailsInUse,
} from "../../actions/crud/emails";
import Admin from "../../Components/Admin";

function SignUp() {
	const [adminLoginCred, setAdminLoginCred] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const router = useRouter();

	const { email, password } = adminLoginCred;

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);

		const signUpAdminRes = await signUpAdmin(adminLoginCred);
		if (signUpAdminRes.success) {
			const adminUid = signUpAdminRes.adminUid;
			console.log(adminUid);
			const adminEmailRes = await addAdminEmails(email, adminUid, password);
			if (adminEmailRes.success) {
				setLoading(false);
				setMessage(signUpAdminRes.message);
				setTimeout(() => {
					router.push("/admin");
				}, 1000);
			} else {
				setLoading(false);
				setMessage(adminEmailRes.message);
			}
		} else {
			setLoading(false);
			setMessage(signUpAdminRes.message);
		}
	}

	function handleChange(e) {
		setMessage("");
		const { name, value } = e.target;
		setAdminLoginCred((prev) => ({ ...prev, [name]: value }));
	}
	return (
		<Layout currentPage="admin">
			<Admin>
				<h2>Admin Sign Up</h2>
				<form onSubmit={handleSubmit}>
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
							id="password"
							minLength="8"
							required
						/>
						<label htmlFor="password">Admin password</label>
					</div>
					{loading ? (
						<p>Loading...</p>
					) : (
						<button type="submit" name="signup">
							Sign up
						</button>
					)}
					{message && JSON.stringify(message)}
				</form>
			</Admin>
		</Layout>
	);
}

export default SignUp;
