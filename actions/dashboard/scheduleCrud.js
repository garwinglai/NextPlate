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
import {
	db,
	increment,
	decrement,
	incrementArgs,
	decrementArgs,
} from "../../firebase/fireConfig";
import _ from "lodash";
import sendNotification from "../heroku/notifications";
import { updateOrder } from "./ordersCrud";
import { isTomorrow } from "date-fns";

async function createNewSchedule(
	bizId,
	scheduleData,
	dayOfWeek,
	hourStart,
	minStart,
	hourEnd,
	minEnd,
	actualDate,
	shortDate,
	defaultPrice,
	itemName,
	emoji
) {
	const bizDocRef = doc(db, "biz", bizId);
	const docSnap = await getDoc(bizDocRef);

	const numSchedule = scheduleData.numAvailable;
	const timeS = hourStart * 60 + minStart;
	const timeE = hourEnd * 60 + minEnd;
	const { recurringDaily } = scheduleData;

	const currTimeInHours = new Date().getHours();
	const currTimeInMinutes = new Date().getMinutes();
	const currTime = currTimeInHours * 60 + currTimeInMinutes;

	const currShortDate = new Date().toLocaleDateString();

	// * If Today, check startTime is greater than the endTime, return error.
	if (timeS >= timeE) {
		return {
			success: false,
			message: "Please select an appropriate time. (12:00 am - 11:45 pm)",
		};
	}
	// if (currShortDate === shortDate) {
	// 	// * If the startTime is smaller than current time, return error.
	// 	if (timeS < currTime) {
	// 		return {
	// 			success: false,
	// 			message:
	// 				"Please select an appropriate time. Start time has already passed.",
	// 		};
	// 	}
	// }

	if (docSnap.exists()) {
		// * 1) Query for current dayOfWeek, where recurring is true in openHistory collection
		// * 2) Check if scheduled time clashes with existing times
		// * 3) If not, cont. If so, send error.

		// * Removed recurring time overlap check
		// const openHistoryRef = collection(db, "biz", bizId, "openHistory");
		// const queryRecurring = query(
		// 	openHistoryRef,
		// 	where("dayOfWeek", "==", dayOfWeek),
		// 	where("recurring", "==", true)
		// );

		let scheduledId;
		// scheduleData.notificationSent = false;

		// try {
		// 	const recurringSchedulesArr = [];

		// 	const openHistorySnaps = await getDocs(queryRecurring);

		// 	openHistorySnaps.forEach((doc) => {
		// 		const data = doc.data();
		// 		recurringSchedulesArr.push(data);
		// 	});

		// 	for (let i = 0; i < recurringSchedulesArr.length; i++) {
		// 		const currentSchedule = recurringSchedulesArr[i];

		// 		const hourStartPickUp = currentSchedule.hourStart;
		// 		const minStartPickUp = currentSchedule.minStart;
		// 		const hourEndPickUp = currentSchedule.hourEnd;
		// 		const minEndPickUp = currentSchedule.minEnd;

		// 		const getTimeStartPickUp = hourStartPickUp * 60 + minStartPickUp;
		// 		const getTimeEndPickUp = hourEndPickUp * 60 + minEndPickUp;

		// 		const postTimeStartPickUp = hourStart * 60 + minStart;
		// 		const postTimeEndPickUp = hourEnd * 60 + minEnd;

		// 		if (
		// 			(getTimeStartPickUp <= postTimeStartPickUp &&
		// 				postTimeStartPickUp < getTimeEndPickUp) ||
		// 			(getTimeStartPickUp < postTimeEndPickUp &&
		// 				postTimeEndPickUp <= getTimeEndPickUp) ||
		// 			(postTimeStartPickUp <= getTimeStartPickUp &&
		// 				getTimeStartPickUp < postTimeEndPickUp) ||
		// 			(postTimeStartPickUp < getTimeEndPickUp &&
		// 				getTimeEndPickUp <= postTimeEndPickUp)
		// 		) {
		// 			return {
		// 				success: false,
		// 				message:
		// 					"The selected time overlaps an existing schedule. Please select another time.",
		// 			};
		// 		}
		// 	}
		// } catch (error) {
		// 	return {
		// 		success: false,
		// 		message: `Error fetching recurring docs: ${error}`,
		// 	};
		// }

		// * Setting up variables to use for creating a new schedule
		const openHistory = scheduleData;
		openHistory.createdAt = new serverTimestamp();

		let dayOfWeekIndex;
		let newNextScheduledData = scheduleData;

		const docData = docSnap.data();
		const bizName = docData.name;
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

		// * Check if weeklySchedules data exists in biz. If not, add post to openHistory
		if (
			!docData.weeklySchedules ||
			Object.keys(docData.weeklySchedules).length === 0
		) {
			const res = await addOpenHistory(bizId, openHistory);
			if (res.success) {
				const firstPost = res.firstPost;

				scheduledId = res.id;
				newNextScheduledData.id = scheduledId;
				let weeklySchedules;

				if (recurringDaily) {
					const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

					for (let i = 0; i < daysOfWeek.length; i++) {
						const currDay = daysOfWeek[i];
						weeklySchedules = {
							...weeklySchedules,
							[currDay]: { [scheduledId]: newNextScheduledData },
						};
					}
				} else {
					weeklySchedules = {
						[dayOfWeekIndex]: { [scheduledId]: newNextScheduledData },
					};
				}

				console.log("weeklyS", weeklySchedules);

				batch.set(bizDocRef, { weeklySchedules }, { merge: true });

				// * Increment numSchedules based on if the post is the first
				if (firstPost) {
					batch.set(
						bizDocRef,
						{ numSchedules: incrementArgs(numSchedule) },
						{ merge: true }
					);
				} else {
					batch.update(bizDocRef, { numSchedules: incrementArgs(numSchedule) });
				}
			} else {
				return res;
			}
		} else {
			// * weeklySchedules already exists, so check if dayOfWeekIndex key exists in nextSchedule

			const existingNextSchedule = docData.weeklySchedules;

			if (!recurringDaily) {
				if (existingNextSchedule.hasOwnProperty(dayOfWeekIndex)) {
					// * If weeklySchedules has dayIndex, check if there is overlapping times. If so, send error

					// * Removed overlap time check
					// const weeklySchedulesIdxArray = [];

					// for (const key in schedulesPerDay) {
					// 	if (schedulesPerDay[key].status === "Regular") {
					// 		weeklySchedulesIdxArray.push(key);
					// 	}
					// }

					// for (let i = 0; i < weeklySchedulesIdxArray.length; i++) {
					// 	const key = weeklySchedulesIdxArray[i];
					// 	const currentSchedule = schedulesPerDay[key];

					// 	const hourStartPickUp = currentSchedule.hourStart;
					// 	const minStartPickUp = currentSchedule.minStart;
					// 	const hourEndPickUp = currentSchedule.hourEnd;
					// 	const minEndPickUp = currentSchedule.minEnd;
					// 	const postDate = currentSchedule.scheduledDate;

					// 	if (postDate === actualDate) {
					// 		const getTimeStartPickUp = hourStartPickUp * 60 + minStartPickUp;
					// 		const getTimeEndPickUp = hourEndPickUp * 60 + minEndPickUp;

					// 		const postTimeStartPickUp = hourStart * 60 + minStart;
					// 		const postTimeEndPickUp = hourEnd * 60 + minEnd;

					// 		if (
					// 			(getTimeStartPickUp <= postTimeStartPickUp &&
					// 				postTimeStartPickUp < getTimeEndPickUp) ||
					// 			(getTimeStartPickUp < postTimeEndPickUp &&
					// 				postTimeEndPickUp <= getTimeEndPickUp) ||
					// 			(postTimeStartPickUp <= getTimeStartPickUp &&
					// 				getTimeStartPickUp < postTimeEndPickUp) ||
					// 			(postTimeStartPickUp < getTimeEndPickUp &&
					// 				getTimeEndPickUp <= postTimeEndPickUp)
					// 		) {
					// 			return {
					// 				success: false,
					// 				message:
					// 					"The selected time overlaps an existing schedule. Please select another time.",
					// 			};
					// 		}
					// 	}
					// }

					const resOpenHistory = await addOpenHistory(bizId, openHistory);

					if (resOpenHistory.success) {
						scheduledId = resOpenHistory.id;
						newNextScheduledData.id = scheduledId;

						const schedulesPerDay = existingNextSchedule[dayOfWeekIndex];

						const newScheduleMapUpdated = {
							...schedulesPerDay,
							[scheduledId]: newNextScheduledData,
						};

						existingNextSchedule[dayOfWeekIndex] = newScheduleMapUpdated;

						batch.update(bizDocRef, {
							weeklySchedules: existingNextSchedule,
							numSchedules: incrementArgs(numSchedule),
						});
					} else {
						return resOpenHistory;
					}
				} else {
					// * No dayIndex key in weeklySchedules, so add to openHistory and add to weeklySchedules
					const resHistory = await addOpenHistory(bizId, openHistory);
					if (resHistory.success) {
						scheduledId = resHistory.id;
						newNextScheduledData.id = scheduledId;
						// delete newNextScheduledData.createdAt;

						existingNextSchedule[dayOfWeekIndex] = {
							[scheduledId]: newNextScheduledData,
						};

						batch.update(bizDocRef, {
							weeklySchedules: existingNextSchedule,
							numSchedules: incrementArgs(numSchedule),
						});
					} else {
						return resHistory;
					}
				}
			} else {
				// * Recurring daily
				const resHistory = await addOpenHistory(bizId, openHistory);
				if (resHistory.success) {
					scheduledId = resHistory.id;
					newNextScheduledData.id = scheduledId;

					const dayOfWeek = [1, 2, 3, 4, 5, 6, 7];
					let newScheduleMapUpdated = {};

					for (let i = 0; i < dayOfWeek.length; i++) {
						const currDay = dayOfWeek[i];
						const schedulesPerDay = existingNextSchedule[currDay];

						console.log("schedulesPerDay", schedulesPerDay);

						if (schedulesPerDay) {
							console.log("some schedules");

							newScheduleMapUpdated[currDay] = {
								...schedulesPerDay,
								[scheduledId]: newNextScheduledData,
							};
						} else {
							console.log("no schedules");

							newScheduleMapUpdated = {
								...newScheduleMapUpdated,
								[currDay]: { [scheduledId]: newNextScheduledData },
							};
						}
					}

					batch.update(bizDocRef, {
						weeklySchedules: newScheduleMapUpdated,
						numSchedules: incrementArgs(numSchedule),
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

		// * variables for today and tomorrow
		const todayDate = new Date();
		const todayDay = todayDate.getDay();
		const todayDayPlusOne = todayDay + 1;
		todayDate.setDate(todayDate.getDate() + 1);
		const tomorrowDay = todayDate.getDay();
		const tomorrowDayPlusOne = tomorrowDay + 1;

		// * Batch Commit
		try {
			await batch.commit();

			// * Check if today or tomorrow, if so send notification
			if (
				dayOfWeekIndex == todayDayPlusOne ||
				dayOfWeekIndex == tomorrowDayPlusOne
			) {
				sendNotification(
					bizId,
					bizName,
					"regular",
					null,
					null,
					null,
					scheduledId,
					dayOfWeekIndex,
					scheduleData.recurring,
					null,
					defaultPrice,
					itemName,
					emoji
				);
			}

			return { success: true, message: "Schedule created successfully" };
		} catch (error) {
			console.log("error commiting regular schedule batch", error);
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
	currShortDate,
	defaultPrice,
	itemName,
	emoji
) {
	const bizDocRef = doc(db, "biz", bizId);
	const bizDocSnap = await getDoc(bizDocRef);

	const numSchedule = flashScheduledData.numAvailable;

	if (bizDocSnap.exists()) {
		const docData = bizDocSnap.data();
		const existingNextSchedule = docData.weeklySchedules;
		const flashEndTime = docData.flashEnds;
		const bizName = docData.name;
		let flashScheduleId;

		flashScheduledData.createdAt = new serverTimestamp();
		flashScheduledData.notificationSent = false;
		const batch = writeBatch(db);
		if (!existingNextSchedule) {
			// * If no weeklySchedules, add to openHistory, then add to weeklySchedules
			const resOpenHistory = await addOpenHistory(bizId, flashScheduledData);
			if (resOpenHistory.success) {
				const firstPost = resOpenHistory.firstPost;
				flashScheduleId = resOpenHistory.id;
				flashScheduledData.id = flashScheduleId;

				// * Increment numSchedules based on if the post is the first
				if (firstPost) {
					batch.set(
						bizDocRef,
						{
							numSchedules: incrementArgs(numSchedule),
							flashEnds: endTimeEpochMiliSec,
						},
						{ merge: true }
					);
				} else {
					if (flashEndTime) {
						if (endTimeEpochMiliSec > flashEndTime) {
							batch.update(bizDocRef, {
								numSchedules: incrementArgs(numSchedule),
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, {
								numSchedules: incrementArgs(numSchedule),
							});
						}
					} else {
						batch.update(bizDocRef, {
							numSchedules: incrementArgs(numSchedule),
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

				const weeklySchedules = {
					[dayIndex]: { [flashScheduleId]: flashScheduledData },
				};

				batch.set(
					bizDocRef,
					{ weeklySchedules, flashDay: currShortDate },
					{ merge: true }
				);
			} else {
				return resOpenHistory;
			}
		} else {
			if (existingNextSchedule.hasOwnProperty(dayIndex)) {
				const resHistory = await addOpenHistory(bizId, flashScheduledData);

				if (resHistory.success) {
					flashScheduleId = resHistory.id;
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
								weeklySchedules: existingNextSchedule,
								numSchedules: incrementArgs(numSchedule),
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, {
								weeklySchedules: existingNextSchedule,
								numSchedules: incrementArgs(numSchedule),
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
							weeklySchedules: existingNextSchedule,
							numSchedules: incrementArgs(numSchedule),
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
					flashScheduleId = resHistory.id;
					flashScheduledData.id = flashScheduleId;

					existingNextSchedule[dayIndex] = {
						[flashScheduleId]: flashScheduledData,
					};

					if (flashEndTime) {
						if (endTimeEpochMiliSec > flashEndTime) {
							batch.update(bizDocRef, {
								weeklySchedules: existingNextSchedule,
								numSchedules: incrementArgs(numSchedule),
								flashEnds: endTimeEpochMiliSec,
							});
						} else {
							batch.update(bizDocRef, {
								weeklySchedules: existingNextSchedule,
								numSchedules: incrementArgs(numSchedule),
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
							weeklySchedules: existingNextSchedule,
							numSchedules: incrementArgs(numSchedule),
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
			sendNotification(
				bizId,
				bizName,
				"flash",
				null,
				null,
				null,
				flashScheduleId,
				dayIndex,
				null,
				endTimeEpochMiliSec,
				defaultPrice,
				itemName,
				emoji
			);

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

async function removeSchedule(bizId, scheduleId, dayIndex, event) {
	const bizDocRef = doc(db, "biz", bizId);
	const openHistoryRef = doc(db, "biz", bizId, "openHistory", scheduleId);

	const bizDocRefSnap = await getDoc(bizDocRef);

	if (bizDocRefSnap.exists()) {
		const docData = bizDocRefSnap.data();
		const dayIdxStr = dayIndex.toString();

		const weeklySchedules = docData.weeklySchedules;
		const currDayIdxObj = docData.weeklySchedules[dayIdxStr];
		const daysPickUpArr = docData.daysWithPickup;
		const numSchedule =
			docData.weeklySchedules[dayIndex][scheduleId].numAvailable;

		const arrayOfCurrSchedule = Object.keys(currDayIdxObj);

		if (event === "flash") {
			let flashCounter = 0;
			let numSchedule = 0;

			for (const key in weeklySchedules) {
				const dayIdxObj = weeklySchedules[key];
				for (const property in dayIdxObj) {
					const scheduleObj = dayIdxObj[property];
					const scheduleStatus = scheduleObj.status;
					numSchedule = scheduleObj.numAvailable;
					if (scheduleStatus === "Flash") {
						flashCounter += 1;
					}
				}
			}

			if (flashCounter === 1) {
				try {
					await updateDoc(bizDocRef, {
						flashDay: deleteField(),
						flashEnds: deleteField(),
					});
				} catch (error) {
					console.log("delete flash error", error);
					return {
						success: false,
						message: `Error deleting flash schedule`,
					};
				}
			}
		}

		if (arrayOfCurrSchedule.length <= 1) {
			try {
				await updateDoc(
					bizDocRef,
					{
						daysWithPickup: daysPickUpArr.filter((day) => day !== dayIndex),
						[`weeklySchedules.${dayIndex}`]: deleteField(),
						numSchedules: decrementArgs(numSchedule),
					},
					{ merge: true }
				);
			} catch (error) {
				console.log("delete schedule", error);
				return {
					success: false,
					message: `Error deleting scheduled data.`,
				};
			}
		} else {
			try {
				await updateDoc(
					bizDocRef,
					{
						[`weeklySchedules.${dayIndex}.${scheduleId}`]: deleteField(),
						numSchedules: decrementArgs(numSchedule),
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
			await updateDoc(openHistoryRef, {
				recurring: false,
				status: "Removed",
				statusIndex: 2,
				removedBy: "Biz",
				removedAt: new serverTimestamp(),
			});
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

async function updatePastSchedules(bizId) {
	const bizDocRef = doc(db, "biz", bizId);
	const bizSnapshot = await getDoc(bizDocRef);

	const batch = writeBatch(db);

	if (bizSnapshot.exists()) {
		const docData = bizSnapshot.data();
		const weeklySchedules = docData.weeklySchedules;

		if (!weeklySchedules || Object.keys(weeklySchedules).length === 0) {
			return { success: true };
		}

		const date = new Date();
		const dayNum = date.getDay() + 1;
		const actualDate = date.toDateString();
		const startEpochToday = Date.parse(actualDate + " " + "00:00:00");
		const daysPickUpArr = docData.daysWithPickup;
		let hasScheduleIdxArr = [];

		for (const dayIdx in weeklySchedules) {
			const dayIdxObj = weeklySchedules[dayIdx];
			const weeklySchedulesLen = Object.keys(weeklySchedules).length;
			let hasRecur = false;

			// * Set hasRecur to true if today exists in weeklySchedules, so it does not remove from daysWithPickup.
			if (dayNum === dayIdx) {
				hasRecur = true;
			}

			if (Object.keys(dayIdxObj).length === 0) {
				try {
					await updateDoc(
						bizDocRef,
						{
							[`weeklySchedules.${dayIdx}`]: deleteField(),
						},
						{ merge: true }
					);

					hasRecur = false;
				} catch (error) {
					console.log("delete schedule", error);
					return {
						success: false,
						message: `Error deleting empty dayIdxObj.`,
					};
				}
			}

			for (const scheduleId in dayIdxObj) {
				const openHistoryRef = doc(db, "biz", bizId, "openHistory", scheduleId);
				const scheduleObj = dayIdxObj[scheduleId];
				const scheduleStartTime = scheduleObj.startTime;
				const scheduleEndTime = scheduleObj.endTime;
				const recurring = scheduleObj.recurring;
				const scheduleNumAvail = scheduleObj.numAvailable;
				const scheduleNumAvailStart = scheduleObj.numAvailableStart;
				const dayIdxObjLen = Object.keys(dayIdxObj).length;

				if (scheduleEndTime < startEpochToday) {
					if (recurring) {
						hasRecur = true;
						const oneWeekMiliSec = 604800000;
						const nextWeekStartTime = scheduleStartTime + oneWeekMiliSec;
						const nextWeekEndTime = scheduleEndTime + oneWeekMiliSec;

						if (scheduleNumAvail != scheduleNumAvailStart) {
							try {
								await updateDoc(
									bizDocRef,
									{
										[`weeklySchedules.${dayIdx}.${scheduleId}.numAvailable`]:
											scheduleNumAvailStart,
									},
									{ merge: true }
								);
							} catch (error) {
								return {
									success: false,
									message: `Recurring updating numAvail weeklySchedules ${error}`,
								};
							}
						}

						// * Update start & endtime for recurring
						try {
							await updateDoc(
								bizDocRef,
								{
									[`weeklySchedules.${dayIdx}.${scheduleId}.notificationSent`]: false,
									[`weeklySchedules.${dayIdx}.${scheduleId}.startTime`]:
										nextWeekStartTime,
									[`weeklySchedules.${dayIdx}.${scheduleId}.endTime`]:
										nextWeekEndTime,
								},
								{ merge: true }
							);
						} catch (error) {
							return {
								success: false,
								message: `Recurring updating numAvail openHistory ${error}`,
							};
						}

						try {
							await updateDoc(
								openHistoryRef,
								{
									numAvailable: scheduleNumAvailStart,
									notificationSent: false,
									startTime: nextWeekStartTime,
									endTime: nextWeekEndTime,
								},
								{ merge: true }
							);
						} catch (error) {
							return {
								success: false,
								message: `Error updating recur numAvail openHistory ${error}`,
							};
						}
					} else {
						if (dayIdxObjLen <= 1) {
							try {
								await updateDoc(
									bizDocRef,
									{
										[`weeklySchedules.${dayIdx}`]: deleteField(),
									},
									{ merge: true }
								);
							} catch (error) {
								console.log("delete schedule", error);
								return {
									success: false,
									message: `Error deleting scheduled data.`,
								};
							}
						} else {
							try {
								await updateDoc(
									bizDocRef,
									{
										[`weeklySchedules.${dayIdx}.${scheduleId}`]: deleteField(),
									},
									{ merge: true }
								);

								dayIdxObjLen -= 1;
							} catch (error) {
								console.log("delete schedule", error);
								return {
									success: false,
									message: `Error deleting scheduled data.`,
								};
							}
						}

						try {
							await updateDoc(openHistoryRef, {
								removedAt: new serverTimestamp(),
								removedBy: "Automatic",
								recurring: false,
							});
						} catch (error) {
							return {
								success: false,
								message: "Error deleting schedule/history. Please try again.",
							};
						}
					}
				} else {
					// * For all daysIdx in the future, don't delete from daysWithPickup, so hasRecur = true
					hasRecur = true;
				}
			}

			if (!hasRecur) {
				const filter = daysPickUpArr.filter((day) => {
					const dayIdxNum = parseInt(dayIdx);
					return day !== dayIdxNum;
				});
				try {
					await updateDoc(bizDocRef, {
						daysWithPickup: filter,
					});
				} catch (error) {
					return {
						success: false,
						message: `Error deleting days with pickup: ${error}`,
					};
				}
			}
		}
		return {
			success: true,
			message: "Schedule successfully deleted.",
		};
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
	updatePastSchedules,
};
