import React, { useEffect } from "react";
import { useRouter } from "next/router";

// * Redirect to app landing page on Wix.
function AppLandingPage() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.home.nextplate.app/app-landing-page");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default AppLandingPage;
