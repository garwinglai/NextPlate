import React, { useEffect } from "react";
import { useRouter } from "next/router";

function Restaurants() {
	const router = useRouter();

	useEffect(() => {
		router.push("https://www.home.nextplate.app/restaurants");
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default Restaurants;
