import React, { useState, useEffect } from "react";
import Layout from "../../../../Components/Layout";
import {
	getOrderHistory,
	getSearchOrderHistory,
} from "../../../../actions/dashboard/ordersCrud";
import { getBiz } from "../../../../actions/crud/bizUser";
import { useRouter } from "next/router";
import styles from "../../../../styles/pages/dashboard/orders/orders-history.module.css";
import { getLocalStorage } from "../../../../actions/auth/auth";
import { Button } from "@mui/material";
import OrderHistoryBiz from "../../../../Components/Dashboard/Orders/History/OrderHistoryBiz";

function HistoryOrders() {
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});

	const [userDataValues, setUserDataValues] = useState({
		userLoading: false,
		getUserMsg: "",
		userData: [],
	});

	const { userLoading, getUserMsg, userData } = userDataValues;
	const { storedUser, bizId } = user;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUser = JSON.parse(getLocalStorage("user"));

		const bizOwned = storedUser.bizOwned;
		const numBizOwned = Object.keys(bizOwned).length;

		let bizIdArr = [];

		if (storedUser) {
			if (numBizOwned > 1) {
				bizIdArr = Object.keys(bizOwned);

				setUser({ storedUser, bizId: bizIdArr });
			} else {
				const localStorageBizId = Object.keys(bizOwned).pop();
				bizIdArr.push(localStorageBizId);

				setUser({ storedUser, bizId: bizIdArr });
			}
		}

		if (bizIdArr.length === 0) {
			return;
		}

		loadBiz(bizIdArr);
	}, [uid]);

	const loadBiz = async (bizIdArr) => {
		setUserDataValues((prev) => ({
			userLoading: true,
			getUserMsg: "",
		}));

		let bizDataArr = [];

		for (let i = 0; i < bizIdArr.length; i++) {
			const currBizId = bizIdArr[i];

			const resUser = await getBiz(currBizId, []);
			const { success, message } = resUser;

			if (success) {
				const resUserData = resUser.docData;
				const bName = resUser.docData.name;
				let isSelected = false;

				if (i === 0) {
					isSelected = true;
				}

				const bizInfo = {
					data: resUserData,
					bizId: currBizId,
					bizName: bName,
					isSelected,
				};

				bizDataArr.push(bizInfo);
			} else {
				// TODO: handle Error
				console.log("error getting user data");
				setUserDataValues((prev) => ({
					userLoading: false,
					getUserMsg: "",
				}));
			}

			setUserDataValues((prev) => ({
				userLoading: false,
				getUserMsg: "",
				userData: bizDataArr,
			}));
		}
	};

	// * Actions ----------------------------------------------

	const handleSelectBizClick = async (user) => {
		let updatedUserData = [];

		for (let i = 0; i < userData.length; i++) {
			const currBiz = userData[i];
			const currBizId = currBiz.bizId;

			if (user.bizId === currBizId) {
				currBiz.isSelected = true;
			} else {
				currBiz.isSelected = false;
			}

			updatedUserData.push(currBiz);
		}

		setUserDataValues((prev) => ({
			...prev,
			userData: updatedUserData,
		}));
	};

	return (
		<Layout uid={uid} currentPage="Orders" subPage="orders-history">
			{/* <h5>
				{" "}
				Message from NextPlate: Order history under construction, our apologies
				for the delays. Update will finish on 9/17. Thank you for understanding.{" "}
			</h5> */}
			<div className={styles.HistoryOrders}>
				<div className={styles.HistoryOrders__main}>
					<div className={`${styles.BizName__container}`}>
						{userData &&
							userData.map((user) => {
								return (
									<Button
										variant={user.isSelected ? "contained" : "outlined"}
										color="secondary"
										key={user.bizId}
										// sx={{ width: 1 }}
										// fullWidth
										onClick={() => handleSelectBizClick(user)}
									>
										{user.bizName}
									</Button>
								);
							})}
					</div>
					{userData &&
						userData.map((user) => {
							if (user.isSelected) {
								return <OrderHistoryBiz key={user.bizId} user={user} />;
							}
						})}
				</div>
			</div>
		</Layout>
	);
}

export default HistoryOrders;
