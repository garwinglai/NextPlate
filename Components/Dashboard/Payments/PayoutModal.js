import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import styles from "../../../styles/components/dashboard/payments/payout-modal.module.css";
import PayoutOrderTabs from "./PayoutOrderTabs";
import {
	collection,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	limit,
	orderBy,
} from "firebase/firestore";
import { db } from "../../../firebase/fireConfig";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "max-content",
	bgcolor: "background.paper",
	border: "1px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

function PayoutModal({ open, close, payout, bizIdArr }) {
	const [openModal, setOpenModal] = useState(true);
	const [orders, setOrders] = useState([]);

	const {
		id,
		createdAt,
		startDateEpoch,
		endDateEpoch,
		startDateShort,
		endDateShort,
		totalSalesStr,
		totalSalesDouble,
		bizFeesStr,
		bizFeesDouble,
		totalBizFeesStr,
		totalBizFeesDouble,
		isBizFeesPct,
		payoutAmtStr,
		payoutAmtDouble,
		paymentDateEpoch,
		paymentDateShort,
		paidToName,
		clientName,
		address,
		stripeId,
		numOrders,
	} = payout;

	const { address_1, address_2, city, state, zip } = address;

	useEffect(() => {
		getOrders(bizIdArr);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getOrders = async (bizIdArr) => {
		try {
			const ordersArr = [];

			for (let i = 0; i < bizIdArr.length; i++) {
				const bizId = bizIdArr[i];

				const ordersDocRef = collection(db, "biz", bizId, "orders");

				const q = query(
					ordersDocRef,
					where("endTime", ">", startDateEpoch),
					where("endTime", "<=", endDateEpoch),
					// statusIndex 3 == Completed
					where("statusIndex", "==", 3),
					orderBy("endTime", "asc")
				);

				const q2 = query(
					ordersDocRef,
					where("endTime", ">", startDateEpoch),
					where("endTime", "<=", endDateEpoch),
					// statusIndex 5 == No Show
					where("statusIndex", "==", 5),
					orderBy("endTime", "asc")
				);

				const ordersSnapshotCompleted = await getDocs(q);
				const ordersSnapshotNoShow = await getDocs(q2);

				ordersSnapshotCompleted.forEach((doc) => {
					const data = doc.data();
					data.id = doc.id;
					ordersArr.push(data);
				});

				ordersSnapshotNoShow.forEach((doc) => {
					const data = doc.data();
					data.id = doc.id;
					ordersArr.push(data);
				});
			}

			setOrders(ordersArr);
		} catch (error) {
			console.log("getOrders error", error);
			// TODO: handle error
		}
	};

	return (
		<React.Fragment>
			<Modal
				open={open}
				onClose={close}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div className={`${styles.flexCol} ${styles.container}`}>
						<div className={`${styles.flexRow} ${styles.justifySpaceBetween}`}>
							<Button color="error" size="small" onClick={() => close()}>
								Close
							</Button>

							<div
								className={`${styles.flexCol} ${styles.alignEnd} ${styles.fromToDate}`}
							>
								<h6 className={`${styles.titleGap}`}>Payment period</h6>
								<p>
									{startDateShort} - {endDateShort}
								</p>
							</div>
						</div>
						<div
							className={`${styles.flexRow} ${styles.gap100} ${styles.justifySpaceBetween} ${styles.paymentToInfo}`}
						>
							<div className={`${styles.flexCol}`}>
								<h6 className={`${styles.titleGap}`}>Payment no.</h6>
								<p>{id}</p>
							</div>
							<div className={`${styles.flexCol} ${styles.alignEnd}`}>
								<h6 className={`${styles.titleGap}`}>Payment date</h6>
								<p>{paymentDateShort}</p>
							</div>
						</div>
						<div
							className={`${styles.flexRow} ${styles.gap100} ${styles.justifySpaceBetween} ${styles.clientInfo}`}
						>
							<div className={`${styles.flexCol}`}>
								<h6 className={`${styles.titleGap}`}>Client information</h6>
								<p>{clientName}</p>
								<p>{address_1}</p>
								<p>{address_2}</p>
								<p>
									{city} {state} {zip}
								</p>
							</div>
							<div className={`${styles.flexCol} ${styles.alignEnd}`}>
								<h6 className={`${styles.titleGap}`}>Payment to</h6>
								<p>{paidToName}</p>
							</div>
						</div>
						<div className={`${styles.gridSix} ${styles.gridBorder}`}>
							<h5 className={`${styles.gridItem}`}>#Id</h5>
							<h5 className={`${styles.gridItem}`}>Date</h5>
							<h5 className={`${styles.gridItem}`}>Item</h5>
							<h5 className={`${styles.gridItem}`}>Sale & Tax</h5>
							<h5 className={`${styles.gridItem}`}>Qty</h5>
							<h5 className={`${styles.gridItem}`}>Fees ({bizFeesStr})</h5>
							<h5 className={`${styles.gridItem}`}>Total</h5>
						</div>

						{orders.map((order) => {
							return (
								<PayoutOrderTabs
									key={order.id}
									order={order}
									bizFeesDouble={bizFeesDouble}
									isBizFeesPct={isBizFeesPct}
									bizFeesStr={bizFeesStr}
								/>
							);
						})}

						<div
							className={`${styles.flexRow} ${styles.justifyEnd} ${styles.totalPayoutAndFees}`}
						>
							<div className={`${styles.flexCol} ${styles.subtotalGap}`}>
								<h5>Subtotal</h5>
								<h5>Fees</h5>
								<h5>Total Payout</h5>
							</div>
							<div
								className={`${styles.flexCol} ${styles.alignEnd} ${styles.subtotalGap}`}
							>
								<p>{totalSalesStr}</p>
								<p>{totalBizFeesStr}</p>
								<p>{payoutAmtStr}</p>
							</div>
						</div>
						<p>NextPlate</p>
					</div>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default PayoutModal;
