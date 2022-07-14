import {
	doc,
	getDoc,
	getDocs,
	collection,
	orderBy,
	startAt,
	endAt,
	query,
} from "firebase/firestore";
import { db } from "../firebase/fireConfig";
import * as geofire from "geofire-common";

const getNearbyUserTokens = async (bizId) => {
	const bizDocRef = doc(db, "biz", bizId);
	const bizSnapShot = await getDoc(bizDocRef);

	if (!bizSnapShot.exists()) {
		return;
	}

	const bizData = bizSnapShot.data();
	const latitude = bizData.lat;
	const longitude = bizData.lng;
	const center = [latitude, longitude];
	const radiumInMiles = 2 * 1000;

	const bounds = geofire.geohashQueryBounds(center, radiumInMiles);
	const promises = [];

	for (const b in bounds) {
		const currBound = bounds[b];

		// * get collection from userTokens
		// const bizCollectionRef = collection(db, "biz");
		// const q = query(
		// 	bizCollectionRef,
		// 	orderBy("geohash"),
		// 	startAt(currBound[0]),
		// 	endAt(currBound[1])
		// );

		promises.push(getDocs(q));
	}
};

export default getNearbyUserTokens;
