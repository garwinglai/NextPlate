import React from "react";
import { versionNumber } from "../../staticData/versionNumber";

// * Dynamic styling
function handleStyle(route) {
	if (route === "web") {
		const styleWeb = {
			margin: "50px 0 30px 30px",
			fontSize: "12px",
		};

		return styleWeb;
	}

	if (route === "mobile") {
		const styleMobile = {
			fontSize: "!4px",
			margin: "50px 0 20px 20px",
		};
		return styleMobile;
	}
}

function Version({ route }) {
	return <p style={handleStyle(route)}>{versionNumber}</p>;
}

export default Version;
