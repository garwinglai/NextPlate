import React, { useState } from "react";
import Layout from "../../Components/Layout";
import { useRouter } from "next/router";
import { signUpAdmin } from "../../actions/auth/auth";
import { addEmailsInUse, addAdminEmailsInUse } from "../../actions/crud/emails";
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
			const adminEmailRes = await addAdminEmailsInUse(email);
			if (adminEmailRes.success) {
				const emailRes = await addEmailsInUse(email);
				if (emailRes.success) {
					setLoading(false);
					setMessage(signUpAdminRes.message);
					setTimeout(() => {
						router.push("/admin");
					}, 1000);
				} else {
					setLoading(false);
					setMessage(emailRes.message);
				}
			} else {
				setLoading(false);
				setMessage(adminEmailRes.message);
			}
		} else {
			setLoading(false);
			setMessage(signUpAdminRes.message);
		}

		try {
			const user = await signUpAdmin(adminLoginCred);

			if (user.signedUp) {
				const userEmail = user.user.email;
				await addEmailsInUse(userEmail);
				await addAdminEmailsInUse(userEmail);
				setLoading(false);
				router.push("/admin");
			} else {
				setLoading(false);
				setMessage(user.message);
			}
		} catch (e) {
			setLoading(false);
			if ((e.message = "Email already in use.")) {
				setMessage(e.message);
			} else {
				setMessage(e.message);
			}
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
							// pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
							// 1 lc letter, 1 uc letter, 1 number, 8 length
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
