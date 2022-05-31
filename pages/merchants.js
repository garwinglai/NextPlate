import React, { useEffect } from "react";
import { useRouter } from "next/router";

function Merchants() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.home.nextplate.app/for-business");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default Merchants;
