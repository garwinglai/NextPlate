import React, { useEffect } from "react";
import { useRouter } from "next/router";

function Markets() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.home.nextplate.app/markets");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default Markets;
