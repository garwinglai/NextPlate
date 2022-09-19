import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { getBizAccount } from "../../../actions/crud/bizUser";
import { getLocalStorage } from "../../../actions/auth/auth";
import { CircularProgress } from "@mui/material";
import { fetchStripeAccount } from "../../../actions/heroku/stripeAccount";
import BankInfo from "../../../Components/Dashboard/Payments/BankInfo";
import PaymentHistory from "../../../Components/Dashboard/Payments/PaymentHistory";

export default function Payments() {
	const [tabValue, setTabValue] = useState(0);
	const [stripeValue, setStripeValue] = useState({
		stripeAccId: "",
		detailsSubmitted: false,
		errorsArr: [],
	});
	const [handleRes, setHandleRes] = useState({
		loading: false,
		errMsg: "",
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});

	const { stripeAccId, detailsSubmitted, errorsArr } = stripeValue;
	const { loading, errMsg } = handleRes;
	const { storedUser, bizId } = user;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUserInfo = JSON.parse(getLocalStorage("user"));
		const tempUid = JSON.parse(getLocalStorage("uid"));
		const bizOwned = storedUserInfo.bizOwned;
		const numBizOwned = Object.keys(bizOwned).length;

		let bizIdArr = [];

		if (storedUserInfo) {
			if (numBizOwned > 1) {
				bizIdArr = Object.keys(bizOwned);

				setUser({ storedUser: storedUserInfo, bizId: bizIdArr });
			} else {
				const localStorageBizId = Object.keys(bizOwned).pop();
				bizIdArr.push(localStorageBizId);

				setUser({ storedUser: storedUserInfo, bizId: bizIdArr });
			}
		}

		if (bizIdArr.length === 0) {
			return;
		}

		// * Get stripe account on load to determine if need to onboard or can cash out
		fetchStripeBankAcc(tempUid, bizIdArr);
	}, []);

	// * UseEffect Actions ------------------------------------------
	const fetchStripeBankAcc = async (uid, bizIdArr) => {
		setHandleRes((prev) => ({ ...prev, loading: true }));
		const bizAccRes = await getBizAccount(uid);
		if (bizAccRes.success) {
			const bizAccData = bizAccRes.bizAccData;
			// ! All under same stripeAcc Id
			const stripeAccId = bizAccData.bizOwned[bizIdArr[0]].stripeAccountId;

			let resStripe = await fetchStripeAccount(stripeAccId);
			if (resStripe.success) {
				const detailsSubmitted = resStripe.detailsSubmitted;
				const errorsArr = resStripe.requirementErrorsArr;
				setStripeValue((prev) => ({
					...prev,
					stripeAccId,
					detailsSubmitted,
					errorsArr,
				}));

				setHandleRes((prev) => ({ ...prev, loading: false }));
			} else {
				setHandleRes((prev) => ({
					...prev,
					loading: false,
					errMsg: resStripe.message,
				}));
			}
		} else {
			setHandleRes((prev) => ({
				...prev,
				loading: false,
				errMsg: bizAccRes.message,
			}));
		}
	};

	// * Actions ------------------------------------------
	function handleTabsChange(e, newValue) {
		setTabValue(newValue);
	}

	// * Displays ------------------------------------------
	return (
		<Layout uid={uid} currentPage="Payments">
			<Box
				sx={{
					width: "100%",
					padding: "20px",
					height: "100%",
				}}
			>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs
						value={tabValue}
						onChange={handleTabsChange}
						aria-label="basic tabs example"
					>
						<Tab label="Bank information" {...a11yProps(0)} />
						<Tab label="Payment history" {...a11yProps(1)} />
					</Tabs>
				</Box>
				<TabPanel value={tabValue} index={0}>
					{loading ? (
						<>
							<CircularProgress />
							<p>Fetching bank information, (10 seconds)...</p>
						</>
					) : (
						<BankInfo
							bizIdArr={bizId}
							stripeAccId={stripeAccId}
							detailsSubmitted={detailsSubmitted}
							errMsg={errMsg}
							uid={uid}
						/>
					)}
				</TabPanel>
				<TabPanel value={tabValue} index={1}>
					<PaymentHistory uid={uid} bizIdArr={bizId} />
				</TabPanel>
			</Box>
		</Layout>
	);
}

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired,
};

function a11yProps(index) {
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}
