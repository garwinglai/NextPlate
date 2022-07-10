import React, { useEffect } from "react";
import { useRouter } from "next/router";

function B() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.nextplate.app/business/signin");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default B;
