import React, { useEffect } from "react";
import { useRouter } from "next/router";

function A() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.nextplate.app/admin/signin");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default A;
