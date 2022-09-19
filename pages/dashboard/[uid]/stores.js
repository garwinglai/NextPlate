import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import { getLocalStorage } from "../../../actions/auth/auth";
import { getBizAccount, getBiz } from "../../../actions/crud/bizUser";
import styles from "../../../styles/pages/dashboard/stores.module.css";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import { Button } from "@mui/material";
import StoreCard from "../../../Components/Dashboard/Stores/StoreCard";
import StoreModal from "../../../Components/Dashboard/Stores/StoreModal";

function Stores() {
	const [bizValues, setBizValues] = useState({
		existingBiz: {},
		bizOwned: [],
		contact: {
			firstName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
			password: "",
		},
		errMsg: "",
	});

	const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

	const { existingBiz, bizOwned, contact, errMsg } = bizValues;
	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const bizUid = JSON.parse(getLocalStorage("uid"));

		if (!bizUid) {
			return;
		}

		getBizOwned(bizUid);
	}, []);

	const getBizOwned = async (bizUid) => {
		const data = await getBizAccount(bizUid);
		const { success, bizAccData, message } = data;
		if (success) {
			const bizOwned = bizAccData.bizOwned;
			const bizIdArr = Object.keys(bizOwned);
			const contactInfo = {
				firstName: bizAccData.firstName,
				lastName: bizAccData.lastName,
				email: bizAccData.ownerContact.email,
				phoneNumber: bizAccData.ownerContact.phoneNumber,
				password: bizAccData.login.password,
			};

			setBizValues((prev) => ({
				...prev,
				contact: contactInfo,
				existingBiz: bizOwned,
			}));
			getAllBizData(bizIdArr);
		} else {
			setBizValues((prev) => ({ ...prev, errMsg: message }));
		}
	};

	const getAllBizData = async (bizIdArr) => {
		const bizIdArrLen = bizIdArr.length;
		const bizArr = [];

		for (let i = 0; i < bizIdArrLen; i++) {
			const currId = bizIdArr[i];

			const data = await getBiz(currId);

			const { success, docData, message } = data;

			if (success) {
				bizArr.push(docData);
			} else {
				setBizValues((prev) => ({ ...prev, errMsg: message }));
			}
		}

		setBizValues((prev) => ({ ...prev, bizOwned: bizArr, errMsg: "" }));
	};

	const handleClickCreate = () => {
		setIsStoreModalOpen((prev) => !prev);
	};

	const storeCount = () => {
		const bizOwnedLen = bizOwned.length;

		if (bizOwnedLen > 1) {
			return <h2>{bizOwnedLen} Stores</h2>;
		} else {
			return <h2>{bizOwnedLen} Store</h2>;
		}
	};

	return (
		<Layout uid={uid} currentPage="Stores">
			{isStoreModalOpen && (
				<StoreModal
					isOpen={isStoreModalOpen}
					close={handleClickCreate}
					bizContact={contact}
					existingBiz={existingBiz}
				/>
			)}
			<div className={`${styles.stores}`}>
				<div className={`${styles.header} ${styles.flexRow}`}>
					{storeCount()}
					{errMsg && (
						<Collapse in={isAlertOpen}>
							<Alert
								severity="error"
								onClose={() => {
									setHandlingResponse((prev) => ({
										...prev,
										isAlertOpen: false,
									}));
								}}
								sx={{ width: "90%" }}
							>
								<p style={{ wordBreak: "break-word" }}> {errMsg}</p>
							</Alert>
						</Collapse>
					)}
					<div className={`${styles.btn__container}`}>
						<Button variant="contained" onClick={handleClickCreate}>
							+ Create
						</Button>
					</div>
				</div>
				<div className={`${styles.body} ${styles.flexRow}`}>
					{bizOwned.map((biz) => {
						const bizId = biz.id;
						return <StoreCard key={bizId} biz={biz} bizId={bizId} />;
					})}
				</div>
			</div>
		</Layout>
	);
}

export default Stores;
