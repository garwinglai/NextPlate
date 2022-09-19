import {
	doc,
	getDoc,
	getDocs,
	collection,
	orderBy,
	startAt,
	endAt,
	query,
	limit,
} from "firebase/firestore";
import { db } from "../firebase/fireConfig";
import * as geofire from "geofire-common";

const getNearbyUserId = async (bizId, customerIdArr) => {
	const center = await getBizCoordinates(bizId);
	const radiumInMiles = 3 * 1000;

	if (center === null) {
		return;
	}

	const bounds = geofire.geohashQueryBounds(center, radiumInMiles);
	const returnedUserIdArr = await getUsersInBounds(
		bounds,
		center,
		radiumInMiles,
		customerIdArr
	);

	return returnedUserIdArr;
};

const getBizCoordinates = async (bizId) => {
	const bizDocRef = doc(db, "biz", bizId);
	const bizSnapShot = await getDoc(bizDocRef);

	if (!bizSnapShot.exists()) {
		return null;
	}

	const bizData = bizSnapShot.data();
	const latitude = bizData.lat;
	const longitude = bizData.lng;
	const center = [latitude, longitude];

	return center;
};

const getUsersInBounds = async (
	bounds,
	center,
	radiumInMiles,
	customerIdArr
) => {
	const userIdInBoundsArr = [];

	for (const b in bounds) {
		const userIdInBoundsLen = userIdInBoundsArr.length;

		if (userIdInBoundsLen >= 50) {
			break;
		}

		const currBound = bounds[b];

		// * get collection from userTokens
		const tokenCollectionRef = collection(db, "userTokens");
		const q = query(
			tokenCollectionRef,
			orderBy("geohash"),
			// limit(50),
			startAt(currBound[0]),
			endAt(currBound[1])
		);

		const userTokenSnapshot = await getDocs(q);

		for (let i in userTokenSnapshot.docs) {
			const doc = userTokenSnapshot.docs[i];
			const userId = doc.id;
			const userData = doc.data();

			if (customerIdArr.includes(userId)) {
				continue;
			}

			const userLat = userData.locLat;
			const userLng = userData.locLong;

			const distanceInKm = geofire.distanceBetween([userLat, userLng], center);
			const distanceInMiles = distanceInKm * 1000;

			if (distanceInMiles <= radiumInMiles) {
				if (userIdInBoundsArr.length >= 50) {
					break;
				}

				userIdInBoundsArr.push(userId);
			}
		}
	}

	return userIdInBoundsArr;
};

export default getNearbyUserId;
