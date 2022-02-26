import React, { useEffect, useState } from "react";
import { isAuth } from "../../actions/auth/auth";
import { useRouter } from "next/router";
import AdminLoading from "../AdminLoading";

function Admin({ children }) {
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (!isAuth()) {
			// setLoading(false);
			router.push("/admin/signin");
		} else {
			setLoading(false);
		}
	}, [router]);

	if (loading) {
		return <AdminLoading />;
	}

	return <React.Fragment>{children}</React.Fragment>;
}

export default Admin;
