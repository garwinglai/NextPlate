import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Nav from "./Nav";
import DashMenu from "./Dashboard/DashMenu";
import styles from "../styles/components/layout.module.css";
import DashHeader from "./Dashboard/DashHeader";
import Private from "./Private/Private";
import { getLocalStorage } from "../actions/auth/auth";
import { db } from "../firebase/fireConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

function Layout({ children, currentPage, subPage, uid }) {
	const [notifications, setNotifications] = useState({
		numOrdersUnnoticed: 0,
		errorMessage: "",
		orderData: [],
	});

	const [user, setUser] = useState({
		userData: {},
		bizId: "",
		uid: "",
	});

	const { userData, bizId } = user;

	useEffect(() => {
		// * If on public pages or admin, don't run liveOrders
		if (currentPage === "public" || currentPage === "admin") {
			return;
		}
		const storedUser = JSON.parse(getLocalStorage("user"));
		const storedUid = JSON.parse(getLocalStorage("uid"));
		let bizIdTemp;
		if (storedUser) {
			// ! This only accounts for 1 biz, not multiple
			const bizOwned = storedUser.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ userData: storedUser, bizId: bizIdTemp, uid: storedUid });
		}

		if (!bizIdTemp) {
			return;
		}

		const unsubscribe = liveNotifications(bizIdTemp);
		return () => {
			unsubscribe();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const liveNotifications = (bizIdTemp) => {
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const dateString = date.toLocaleDateString();
			dateArr.push(dateString);
		}

		const bizOrdersRef = collection(db, "biz", bizIdTemp, "orders");
		const queryUnnoticed = query(
			bizOrdersRef,
			where("shortDate", "in", dateArr),
			where("isNoticed", "==", false)
		);

		const unsubscribe = onSnapshot(
			queryUnnoticed,
			(querySnap) => {
				const ordersArr = [];
				querySnap.forEach((doc) => {
					const data = doc.data();
					data.orderId = doc.id;
					ordersArr.push(data);
				});
				const queryLength = querySnap.size;
				setNotifications({
					numOrdersUnnoticed: queryLength,
					orderData: ordersArr,
					errorMessage: "",
				});
			},
			(error) => {
				setNotifications({
					errorMessage: `Error fetching notifications: ${error}`,
				});
			}
		);

		return unsubscribe;
	};

	if (currentPage === "public" || currentPage === "admin") {
		return (
			<React.Fragment>
				<div className={styles.Layout__One}>
					<Nav currentPage={currentPage} />
					<main>{children}</main>
				</div>
			</React.Fragment>
		);
	} else {
		return (
			<React.Fragment>
				<div className={styles.Layout}>
					<Nav currentPage={currentPage} notifications={notifications} />
					<DashMenu currentPage={currentPage} />
					<Private uid={uid}>
						<div className={styles.Layout__Main}>
							<DashHeader
								currentPage={currentPage}
								subPage={subPage}
								notifications={notifications}
								bizId={bizId}
							/>
							<main>{children}</main>
						</div>
					</Private>
				</div>
			</React.Fragment>
		);
	}
}

export default Layout;
