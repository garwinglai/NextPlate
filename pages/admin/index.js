import React from "react";
import Layout from "../../Components/Layout";
import styles from "../../styles/pages/admin/index.module.css";
import Link from "next/link";
import Admin from "../../Components/Admin";

function AdminDashboard() {
	function adminActions() {
		return (
			<div className={styles.AdminDashboard__actions}>
				<fieldset>
					<legend>
						<p>Actions</p>
					</legend>
					<menu>
						<Link href="/admin/orders">
							<a>View all orders</a>
						</Link>
						<Link href="/admin/all-biz">
							<a>View all Businesses</a>
						</Link>
						<Link href="/admin/all-users">
							<a>View all Users</a>
						</Link>
						<Link href="/business/signup">
							<a>Create new user</a>
						</Link>
						<Link href="/admin/signup">
							<a>Admin sign up</a>
						</Link>
						<Link href="/admin/payouts">
							<a>Payout</a>
						</Link>
						<Link href="/admin/stripe">
							<a>Stripe</a>
						</Link>
					</menu>
				</fieldset>
			</div>
		);
	}

	return (
		<Layout currentPage="admin">
			<Admin>
				<div className={styles.AdminDashboard}>
					<h2>Admin Dashboard</h2>
					{adminActions()}
				</div>
			</Admin>
		</Layout>
	);
}

export default AdminDashboard;
