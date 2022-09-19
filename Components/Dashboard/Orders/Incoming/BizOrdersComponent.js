import React, { useEffect, useState } from "react";
import {
	collection,
	query,
	where,
	onSnapshot,
	doc,
	getDocs,
} from "firebase/firestore";
import { db } from "../../../../firebase/fireConfig";
import styles from "../../../../styles/components/dashboard/orders/bizordercomponent.module.css";
import OrderTabComponent from "./OrderTabComponent";
import { Button, CircularProgress } from "@mui/material";
import RemoveSchedule from "./RemoveSchedule";

function BizOrdersComponent({
	bizId,
	statusIndex,
	bizName,
	handleSuccessError,
}) {
	const [orders, setOrders] = useState([]);

	const [activeSchedules, setActiveSchedules] = useState([]);
	const [activeCount, setActiveCount] = useState(0);

	const [pausedSchedules, setPausedSchedules] = useState([]);
	const [pausedCount, setPausedCount] = useState(0);

	const [loading, setLoading] = useState(false);
	const [openRemoveSched, setOpenRemoveSched] = useState(false);

	useEffect(() => {
		const unsubscribe = loadOrders(bizId, statusIndex);
		const unsubSchedules = loadSchedules(bizId);

		return () => {
			unsubscribe();
			unsubSchedules();
		};
	}, []);

	const loadOrders = (bizId, statusIndex) => {
		setLoading(true);
		// * current day
		const today = new Date();
		const todayShort = today.toLocaleDateString();

		const ordersCollectionRef = collection(db, "biz", bizId, "orders");
		const q = query(
			ordersCollectionRef,
			where("shortDate", "==", todayShort),
			where("statusIndex", "==", statusIndex)
		);

		const unsubscribe = onSnapshot(
			q,
			(querySnapshot) => {
				const ordersArr = [];

				querySnapshot.forEach((doc) => {
					const orderData = doc.data();
					orderData.orderId = doc.id;
					ordersArr.push(orderData);
				});

				const sortedOrdersArr = ordersArr.sort(
					(a, b) => b.startTime - a.startTime
				);

				setOrders(sortedOrdersArr);
				setLoading(false);
			},
			(error) => {
				console.log("error listner order", error);
				handleSuccessError(`Error loading orders: ${bizId} | ${error}`, null);
			}
		);

		return unsubscribe;
	};

	const loadSchedules = (bizId) => {
		const bizDocRef = doc(db, "biz", bizId);

		const date = new Date();
		const dayOne = date.getDay() + 1;

		const unsubSchedules = onSnapshot(bizDocRef, (doc) => {
			const data = doc.data();
			const weeklySchedules = data.weeklySchedules;
			const pausedSchedules = data.pausedSchedules;
			let todaySchedules;
			let todayPaused;
			let activeSchedulesArr = [];
			let pausedSchedulesArr = [];
			let activeSchedCount = 0;
			let pausedSchedCount = 0;

			if (
				weeklySchedules !== undefined &&
				Object.keys(weeklySchedules).length !== 0
			) {
				todaySchedules = weeklySchedules[dayOne];

				if (todaySchedules) {
					const weeklyArr = Object.values(todaySchedules);
					const currEpoch = Date.parse(date);

					for (let i = 0; i < weeklyArr.length; i++) {
						const currSched = weeklyArr[i];
						const count = currSched.numAvailable;
						const endTime = currSched.endTime;

						if (currEpoch < endTime) {
							activeSchedCount += count;
							activeSchedulesArr.push(currSched);
						}
					}
				}
			}

			if (
				pausedSchedules !== undefined &&
				Object.keys(pausedSchedules).length !== 0
			) {
				todayPaused = pausedSchedules[dayOne];

				if (todayPaused) {
					const pausedArr = Object.values(todayPaused);

					for (let i = 0; i < pausedArr.length; i++) {
						const currSched = pausedArr[i];
						const count = currSched.numAvailable;

						pausedSchedCount += count;
						pausedSchedulesArr.push(currSched);
					}
				}
			}

			setActiveSchedules(activeSchedulesArr);
			setActiveCount(activeSchedCount);

			setPausedSchedules(pausedSchedulesArr);
			setPausedCount(pausedSchedCount);
		});

		return unsubSchedules;
	};

	const handleSchedules = () => {
		setOpenRemoveSched((prev) => !prev);
	};

	return (
		<div className={`${styles.Box}`}>
			<RemoveSchedule
				bizId={bizId}
				open={openRemoveSched}
				close={handleSchedules}
				activeSchedules={activeSchedules}
				pausedSchedules={pausedSchedules}
			/>
			<div className={`${styles.flexRow}`}>
				<h3>{bizName}</h3>
				{statusIndex === 0 && (activeCount !== 0 || pausedCount !== 0) && (
					<Button
						variant="contained"
						color="secondary"
						onClick={handleSchedules}
					>
						{activeCount > 0 && `${activeCount} left`}{" "}
						{activeCount > 0 && pausedCount > 0 && `- `}
						{pausedCount > 0 && `${pausedCount} paused`}
					</Button>
				)}
			</div>
			{loading ? (
				<CircularProgress />
			) : orders.length !== 0 ? (
				orders.map((order) => {
					return (
						<div className={`${styles.orderGroup}`} key={order.orderId}>
							{order.setPickupTime ? (
								<p>Pickup {order.setPickupTime}</p>
							) : (
								<p>{order.pickupWindow}</p>
							)}
							<OrderTabComponent
								key={order.orderId}
								userOrderDetails={order}
								item={order.items[0]}
								bizId={bizId}
							/>
						</div>
					);
				})
			) : (
				<p className={`${styles.noData}`}>No orders</p>
			)}
		</div>
	);
}

export default BizOrdersComponent;
