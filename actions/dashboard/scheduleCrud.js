import {
	collection,
	addDoc,
	setDoc,
	updateDoc,
	getDocs,
	getDoc,
	doc,
	query,
	orderBy,
	writeBatch,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	deleteField,
	FieldValue,
	limit,
	where,
} from "firebase/firestore";
import { db, increment, decrement } from "../../firebase/fireConfig";
import _ from "lodash";

async function createNewSchedule(
	bizId,
	scheduleData,
	dayOfWeek,
	hourStart,
	minStart,
	hourEnd,
	minEnd,
	actualDate,
	shortDate
) {
	const bizDocRef = doc(db, "biz", bizId);
	const docSnap = await getDoc(bizDocRef);

	const timeS = hourStart * 60 + minStart;
	const timeE = hourEnd * 60 + minEnd;

	const currTimeInHours = new Date().getHours();
	const currTimeInMinutes = new Date().getMinutes();
	const currTime = currTimeInHours * 60 + currTimeInMinutes;

	const currShortDate = new Date().toLocaleDateString();

	// * If Today, check startTime is greater than the endTime, return error.
	if (timeS >= timeE) {
		return {
			success: false,
			message: "Please select an appropriate time. (12:00 AM - 11:59 PM)",
		};
	}
	if (currShortDate === shortDate) {
		// * If the endTime is smaller than current time, reutnr error.
		if (timeE < currTime + 60) {
			return {
				success: false,
				message:
					"The time has passed. Please select an end time at least 1 hour ahead of the current time.",
			};
		}
	}

	if (docSnap.exists()) {
		// * 1) Query for current dayOfWeek, where recurring is true in openHistory collection
		// * 2) Check if scheduled time clashes with existing times
		// * 3) If not, cont. If so, send error.

		const openHistoryRef = collection(db, "biz", bizId, "openHistory");
		const queryRecurring = query(
			openHistoryRef,
			where("dayOfWeek", "==", dayOfWeek),
			where("recurring", "==", true)
		);

		try {
			const recurringSchedulesArr = [];

			const openHistorySnaps = await getDocs(queryRecurring);

			openHistorySnaps.forEach((doc) => {
				const data = doc.data();
				recurringSchedulesArr.push(data);
			});

			for (let i = 0; i < recurringSchedulesArr.length; i++) {
				const currentSchedule = recurringSchedulesArr[i];

				const hourStartPickUp = currentSchedule.hourStart;
				const minStartPickUp = currentSchedule.minStart;
				const hourEndPickUp = currentSchedule.hourEnd;
				const minEndPickUp = currentSchedule.minEnd;

				const getTimeStartPickUp = hourStartPickUp * 60 + minStartPickUp;
				const getTimeEndPickUp = hourEndPickUp * 60 + minEndPickUp;

				const postTimeStartPickUp = hourStart * 60 + minStart;
				const postTimeEndPickUp = hourEnd * 60 + minEnd;

				if (
					(getTimeStartPickUp <= postTimeStartPickUp &&
						postTimeStartPickUp < getTimeEndPickUp) ||
					(getTimeStartPickUp < postTimeEndPickUp &&
						postTimeEndPickUp <= getTimeEndPickUp) ||
					(postTimeStartPickUp <= getTimeStartPickUp &&
						getTimeStartPickUp < postTimeEndPickUp) ||
					(postTimeStartPickUp < getTimeEndPickUp &&
						getTimeEndPickUp <= postTimeEndPickUp)
				) {
					return {
						success: false,
						message:
							"The selected time overlaps an existing schedule. Please select another time.",
					};
				}
			}
		} catch (error) {
			return {
				success: false,
				message: `Error fetching recurring docs: ${error}`,
			};
		}

		// * Setting up variables to use for creating a new schedule
		const openHistory = scheduleData;
		openHistory.createdAt = new serverTimestamp();

		let dayOfWeekIndex;
		let newNextScheduledData = scheduleData;

		const docData = docSnap.data();
		const batch = writeBatch(db);

		switch (dayOfWeek) {
			case "Sun":
				dayOfWeekIndex = 1;
				break;
			case "Mon":
				dayOfWeekIndex = 2;
				break;
			case "Tue":
				dayOfWeekIndex = 3;
				break;
			case "Wed":
				dayOfWeekIndex = 4;
				break;
			case "Thur":
				dayOfWeekIndex = 5;
				break;
			case "Fri":
				dayOfWeekIndex = 6;
				break;
			case "Sat":
				dayOfWeekIndex = 7;
				break;
			default:
				break;
		}

		// * Check if nextScheduled data exists in biz. If not, add post to openHistory
		if (!docData.nextScheduled) {
			const res = await addOpenHistory(bizId, openHistory);
			if (res.success) {
				const firstPost = res.firstPost;

				const scheduledId = res.id;
				newNextScheduledData.id = scheduledId;
				// delete newNextScheduledData.createdAt;
				const nextScheduled = {
					[dayOfWeekIndex]: { [scheduledId]: newNextScheduledData },
				};
				batch.set(bizDocRef, { nextScheduled }, { merge: true });

				// * Increment numSchedules based on if the post is the first
				if (firstPost) {
					batch.set(bizDocRef, { numSchedules: increment }, { merge: true });
				} else {
					batch.update(bizDocRef, { numSchedules: increment });
				}
			} else {
				return res;
			}
		} else {
			// * nextSchedule already exists, so check if dayOfWeekIndex key exists in nextSchedule
			const existingNextSchedule = docData.nextScheduled;

			if (existingNextSchedule.hasOwnProperty(dayOfWeekIndex)) {
				// * If nextScheduled has dayIndex, check if there is overlapping times. If so, send error

				const schedulesPerDay = existingNextSchedule[dayOfWeekIndex];
				const nextScheduledIndexKeyArray = [];

				for (const key in schedulesPerDay) {
					if (schedulesPerDay[key].status === "Regular") {
						nextScheduledIndexKeyArray.push(key);
					}
				}

				for (let i = 0; i < nextScheduledIndexKeyArray.length; i++) {
					const key = nextScheduledIndexKeyArray[i];
					const currentSchedule = schedulesPerDay[key];

					const hourStartPickUp = currentSchedule.hourStart;
					const minStartPickUp = currentSchedule.minStart;
					const hourEndPickUp = currentSchedule.hourEnd;
					const minEndPickUp = currentSchedule.minEnd;
					const postDate = currentSchedule.scheduledDate;

					if (postDate === actualDate) {
						const getTimeStartPickUp = hourStartPickUp * 60 + minStartPickUp;
						const getTimeEndPickUp = hourEndPickUp * 60 + minEndPickUp;

						const postTimeStartPickUp = hourStart * 60 + minStart;
						const postTimeEndPickUp = hourEnd * 60 + minEnd;

						if (
							(getTimeStartPickUp <= postTimeStartPickUp &&
								postTimeStartPickUp < getTimeEndPickUp) ||
							(getTimeStartPickUp < postTimeEndPickUp &&
								postTimeEndPickUp <= getTimeEndPickUp) ||
							(postTimeStartPickUp <= getTimeStartPickUp &&
								getTimeStartPickUp < postTimeEndPickUp) ||
							(postTimeStartPickUp < getTimeEndPickUp &&
								getTimeEndPickUp <= postTimeEndPickUp)
						) {
							return {
								success: false,
								message:
									"The selected time overlaps an existing schedule. Please select another time.",
							};
						}
					}
				}

				// * Add biz if no times overlap in dayIndex
				const resOpenHistory = await addOpenHistory(bizId, openHistory);

				if (resOpenHistory.success) {
					const scheduledId = resOpenHistory.id;
					newNextScheduledData.id = scheduledId;

					const newScheduleMapUpdated = {
						...schedulesPerDay,
						[scheduledId]: newNextScheduledData,
					};

					existingNextSchedule[dayOfWeekIndex] = newScheduleMapUpdated;

					batch.update(bizDocRef, {
						nextScheduled: existingNextSchedule,
						numSchedules: increment,
					});
				} else {
					return resOpenHistory;
				}
			} else {
				// * No dayIndex key in nextScheduled, so add to openHistory and add to nextScheduled
				const resHistory = await addOpenHistory(bizId, openHistory);
				if (resHistory.success) {
					const scheduledId = resHistory.id;
					newNextScheduledData.id = scheduledId;
					// delete newNextScheduledData.createdAt;

					existingNextSchedule[dayOfWeekIndex] = {
						[scheduledId]: newNextScheduledData,
					};

					batch.update(bizDocRef, {
						nextScheduled: existingNextSchedule,
						numSchedules: increment,
					});
				} else {
					return resHistory;
				}
			}
		}

		// * Check days withPickup is empty, if so add dayOfWeekIndext to daysWithPickUp array
		if (!docData.daysWithPickup || docData.daysWithPickup.length === 0) {
			const daysWithPickup = [dayOfWeekIndex];
			batch.set(bizDocRef, { daysWithPickup }, { merge: true });
		} else {
			// * Check if index is already in daysWithPickUp array. If not, add in. If so, no need to add

			if (!docData.daysWithPickup.includes(dayOfWeekIndex)) {
				const daysWithPickup = docData.daysWithPickup;
				daysWithPickup.push(dayOfWeekIndex);
				batch.set(bizDocRef, { daysWithPickup }, { merge: true });
			}
		}

		// * Batch Commit
		try {
			await batch.commit();
			return { success: true, message: "Schedule created successfully" };
		} catch (error) {
			return {
				success: false,
				message: `Error with batch commit. Please try again: ${error} `,
			};
		}
	} else {
		return {
			success: false,
			message:
				"Business id not found. Please login with credentials again try again.",
		};
	}
}

async function addOpenHistory(bizId, openHistory) {
	const openHistoryCollectionRef = collection(db, "biz", bizId, "openHistory");
	const newScheduleDocRef = doc(collection(db, "biz", bizId, "openHistory"));
	const newScheduleId = newScheduleDocRef.id;
	// * Check if openHistory exits.
	// * If no, create new counter to cont num of posts
	// * If yes, then update the counter instead
	let firstPost = true;
	const queryOpenHistory = query(
		openHistoryCollectionRef,
		orderBy("endTime"),
		limit(1)
	);
	const docsSnap = await getDocs(queryOpenHistory);
	if (docsSnap.size > 0) {
		firstPost = false;
	}

	try {
		openHistory.id = newScheduleId;
		await setDoc(newScheduleDocRef, openHistory);

		return { success: true, id: openHistory.id, firstPost };
	} catch (error) {
		return {
			success: false,
			message: `History/Error adding schedule. Please try again: ${error}`,
		};
	}
}

async function createFlashSchedule(
	bizId,
	dayIndex,
	flashScheduledData,
	endTimeEpochMiliSec,
	currShortDate
) {
	const bizDocRef = doc(db, "biz", bizId);
	const bizDocSnap = await getDoc(bizDocRef);

	if (bizDocSnap.exists()) {
		const docData = bizDocSnap.data();
		const existingNextSchedule = docData.nextScheduled;
		const flashEndTime = docData.flashEnds;

		flashScheduledData.createdAt = new serverTimestamp();
		const batch = writeBatch(db);
		if (!existingNextSchedule) {
			// * If no nextScheduled, add to openHistory, then add to nextScheduled
			const resOpenHistory = await addOpenHistory(bizId, flashScheduledData);
			if (resOpenHistory.success) {
				const firstPost = resOpenHistory.firstPost;
				const flashScheduleId = resOpenHistory.id;
				flashScheduledData.id = flashScheduleId;

				// * Increment numSchedules based on if the post is the first
				if (firstPost) {
					batch.set(
						bizDocRef,
						{ numSchedules: increment, flashEnds: endTimeEpochMiliSec },
						{ merge: true }
					);
				} else {
					if (flashEndTime) {
						if (endTimeEpochMiliSec > flashEndTime) {
							batch.update(bizDocRef, {
								numSchedules: increment,
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, { numSchedules: increment });
						}
					} else {
						batch.update(bizDocRef, {
							numSchedules: increment,
						});
						batch.set(
							bizDocRef,
							{
								flashEnds: endTimeEpochMiliSec,
							},
							{ merge: true }
						);
					}
				}

				const nextScheduled = {
					[dayIndex]: { [flashScheduleId]: flashScheduledData },
				};

				batch.set(
					bizDocRef,
					{ nextScheduled, flashDay: currShortDate },
					{ merge: true }
				);
			} else {
				return resOpenHistory;
			}
		} else {
			if (existingNextSchedule.hasOwnProperty(dayIndex)) {
				const resHistory = await addOpenHistory(bizId, flashScheduledData);

				if (resHistory.success) {
					const flashScheduleId = resHistory.id;
					flashScheduledData.id = flashScheduleId;
					const currScheduleAtDayIndex = existingNextSchedule[dayIndex];

					const updatedSchedule = {
						...currScheduleAtDayIndex,
						[flashScheduleId]: flashScheduledData,
					};

					existingNextSchedule[dayIndex] = updatedSchedule;

					if (flashEndTime) {
						if (endTimeEpochMiliSec > flashEndTime) {
							batch.update(bizDocRef, {
								nextScheduled: existingNextSchedule,
								numSchedules: increment,
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, {
								nextScheduled: existingNextSchedule,
								numSchedules: increment,
							});
						}

						batch.set(
							bizDocRef,
							{
								flashDay: currShortDate,
							},
							{ merge: true }
						);
					} else {
						batch.update(bizDocRef, {
							nextScheduled: existingNextSchedule,
							numSchedules: increment,
							flashDay: currShortDate,
						});
						batch.set(
							bizDocRef,
							{
								flashEnds: endTimeEpochMiliSec,
								flashDay: currShortDate,
							},
							{ merge: true }
						);
					}
				} else {
					return resHistory;
				}
			} else {
				const resHistory = await addOpenHistory(bizId, flashScheduledData);
				if (resHistory.success) {
					const flashScheduleId = resHistory.id;
					flashScheduledData.id = flashScheduleId;

					existingNextSchedule[dayIndex] = {
						[flashScheduleId]: flashScheduledData,
					};

					if (flashEndTime) {
						if (endTimeEpochMiliSec > flashEndTime) {
							batch.update(bizDocRef, {
								nextScheduled: existingNextSchedule,
								numSchedules: increment,
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, {
								nextScheduled: existingNextSchedule,
								numSchedules: increment,
							});
						}
						batch.set(
							bizDocRef,
							{
								flashDay: currShortDate,
							},
							{ merge: true }
						);
					} else {
						batch.update(bizDocRef, {
							nextScheduled: existingNextSchedule,
							numSchedules: increment,
						});
						batch.set(
							bizDocRef,
							{
								flashEnds: endTimeEpochMiliSec,
								flashDay: currShortDate,
							},
							{ merge: true }
						);
					}
				} else {
					return resHistory;
				}
			}
		}

		// * Check days withPickup is empty, if so add dayOfWeekIndext to daysWithPickUp array
		if (!docData.daysWithPickup || docData.daysWithPickup.length === 0) {
			const daysWithPickup = [dayIndex];
			batch.set(bizDocRef, { daysWithPickup }, { merge: true });
		} else {
			// * Check if index is already in daysWithPickUp array. If not, add in. If so, no need to add

			if (!docData.daysWithPickup.includes(dayIndex)) {
				const daysWithPickup = docData.daysWithPickup;
				daysWithPickup.push(dayIndex);
				batch.set(bizDocRef, { daysWithPickup }, { merge: true });
			}
		}

		// * Batch Commit
		try {
			await batch.commit();
			return { success: true, message: "Schedule created successfully" };
		} catch (error) {
			return {
				success: false,
				message: `Error with batch commit. Please try again: ${error} `,
			};
		}
	} else {
		return {
			success: false,
			message:
				"Business id not found. Please login with credentials again try again.",
		};
	}
}

async function getNextSchedule(bizId, dayIndex) {
	const docRef = doc(db, "biz", bizId);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		const docData = docSnap.data();
		return { success: true, docData };
	} else {
		return {
			success: false,
			message: "Error getting schedule data. Please login again.",
		};
	}
}

async function getOpenHistoryLive(bizId, shortDateArr) {
	if (!bizId || shortDateArr.length === 0) {
		return;
	}
	const collectionRef = collection(db, "biz", bizId, "openHistory");
	const docRef = doc(db, "biz", bizId);
	const q = query(
		collectionRef,
		where("scheduledDateShort", "in", shortDateArr)
	);
	try {
		let postArr = [];

		const docSnap = await getDocs(q);
		const bizDocSnap = await getDoc(docRef);
		const allPostsCount = bizDocSnap.data().numSchedules;

		docSnap.forEach((doc) => {
			const data = doc.data();
			data.postId = doc.id;
			postArr.push(data);
		});
		return { success: true, postArr, allPostsCount };
	} catch (error) {
		return {
			success: false,
			message: `Error getting scheduled posts: ${error}`,
		};
	}
}

async function removeSchedule(bizId, scheduleId, dayIndex) {
	const bizDocRef = doc(db, "biz", bizId);
	const openHistoryRef = doc(db, "biz", bizId, "openHistory", scheduleId);

	const batch = writeBatch(db);

	const bizDocRefSnap = await getDoc(bizDocRef);

	if (bizDocRefSnap.exists()) {
		const docData = bizDocRefSnap.data();
		const dayIdxStr = dayIndex.toString();
		console.log(dayIdxStr)
		const currDayIdxObj = docData.nextScheduled[dayIdxStr];
		const daysPickUpArr = docData.daysWithPickup;

		const arrayOfCurrSchedule = Object.keys(currDayIdxObj);

		if (arrayOfCurrSchedule.length <= 1) {
			try {
				await updateDoc(
					bizDocRef,
					{
						daysWithPickup: daysPickUpArr.filter((day) => day !== dayIndex),
						[`nextScheduled.${dayIndex}`]: deleteField(),
					},
					{ merge: true }
				);
			} catch (error) {
				return {
					success: false,
					message: `Error deleting scheduled data. ${error}`,
				};
			}
		} else {
			try {
				await updateDoc(
					bizDocRef,
					{
						[`nextScheduled.${dayIndex}.${scheduleId}`]: deleteField(),
					},
					{ merge: true }
				);
			} catch (error) {
				return {
					success: false,
					message: `Error deleting scheduled data. ${error}`,
				};
			}
		}

		try {
			await updateDoc(
				openHistoryRef,
				{
					recurring: false,
					status: "Removed",
					statusIndex: 2,
				},
				{ merge: true }
			);
			return { success: true, message: "Schedule successfully deleted." };
		} catch (error) {
			return {
				success: false,
				message: "Error deleting schedule/history. Please try again.",
			};
		}
	} else {
		return { success: false, message: `User does not exists. Cannot delete.` };
	}
}

export {
	createNewSchedule,
	getNextSchedule,
	getOpenHistoryLive,
	removeSchedule,
	createFlashSchedule,
};
