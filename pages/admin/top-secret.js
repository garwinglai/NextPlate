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
	// 	const bizId = "23ZmuiVcKKqD5439wq3w";

	// 	const docRef = collection(db, "biz", bizId, "payouts");
	// 	const snap = await getDocs(docRef);

	// 	let id;
	// 	let data;

	// 	snap.forEach((doc) => {
	// 		data = doc.data();
	// 		id = doc.id;
	// 	});

	// 	console.log(id, data);
	// };

	// return <button onClick={handleClick}>Click</button>;
	return (
		<h1>Hello, welcome to our secret page. Thanks for visiting NextPlate 😃</h1>
	);
}

export default Temp;
