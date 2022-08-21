import React from "react";
import {
	collection,
	query,
	where,
	onSnapshot,
	QuerySnapshot,
	orderBy,
	limit,
	getDocs,
	getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/fireConfig";
import { sendSMS } from "../../actions/heroku/notifications";

function Temp() {
	// const handleClick = async () => {
	// 	const sms = await sendSMS(
	// 		"Declined",
	// 		"+16265605712",
	// 		"Test Biz",
	// 		"Supply Shortage"
	// 	);
	// };

	// return <button onClick={handleClick}>Click</button>;
	return <h1>Hello</h1>;
}

export default Temp;
