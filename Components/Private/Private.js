import React, { useState, useEffect } from "react";
import {
	isAuth,
	signOutUser,
	removeCookie,
	removeLocalStorage,
} from "../../actions/auth/auth";
import { useRouter } from "next/router";
import CircularProgress from "@mui/material/CircularProgress";

function Private({ children, uid }) {
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (!isAuth()) {
			router.push("/business/signin");
		} else {
			const resAuth = isAuth();
			const resUID = resAuth.uid;
			if (uid) {
				if (resUID === uid) {
					setLoading(false);
				} else {
					const signOut = async () => {
						const res = await signOutUser();
						if (res.success) {
							router.push("/business/signin");
						}
					};
					signOut();
				}
			}
		}
	}, [uid, router]);

	if (loading) {
		return <CircularProgress />;
	}

	return <React.Fragment>{children}</React.Fragment>;
}

export default Private;
