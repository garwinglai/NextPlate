import React, { useEffect } from "react";
import { useRouter } from "next/router";

// * Redirect to Wix home page.
function Home() {
	const router = useRouter();

	// useEffect(() => {
	// }, [router]);
	useEffect(() => {
		router.push("https://www.home.nextplate.app");

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <div style={{ display: "none" }}>hello</div>;
}

export default Home;
