import React, { useState } from "react";
import styles from "../../styles/components/dashboard/dashheader.module.css";
import { ClickAwayListener, IconButton } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsWeb from "./Notifications/NotificationsWeb";
import { useRouter } from "next/router";
import { Avatar } from "@mui/material";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { getAuth } from "firebase/auth";

// const auth = getAuth();
// const user = auth.currentUser;

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

function DashHeader({
	currentPage,
	subPage,
	notifications,
	notificationsConfirmed,
	bizIdArr,
}) {
	const [showNotifications, setShowNotifications] = useState(false);

	const [value, setValue] = useState(
		subPage === "incoming-orders" ? "one" : "two"
	);

	const { numOrdersUnnoticed, errorMessage, orderData } = notifications;

	const router = useRouter();
	const uid = router.query.uid;

	// * ACTIONS --------------------------------------------

	function handleOnClick() {
		setShowNotifications((prev) => !prev);
	}

	function handleClickAway() {
		setShowNotifications(false);
	}

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	function handleClick(e) {
		const page = e.target.innerText;

		if (page === "ORDERS") {
			router.push(`/dashboard/${uid}/orders/incoming-orders`);
		}

		if (page === "HISTORY") {
			router.push(`/dashboard/${uid}/orders/orders-history`);
		}
	}

	// * DISPLAYS --------------------------------------------

	function showOrdersLegendAndNav() {
		return (
			<Box
				sx={{
					width: "100%",
					display: "flex",
					justifyContent: "flex-end",
					paddingRight: "40px",
				}}
			>
				<Tabs
					value={value}
					onChange={handleChange}
					textColor="primary"
					indicatorColor="primary"
					aria-label="secondary tabs example"
					onClick={handleClick}
				>
					<Tab
						label="Orders"
						value="one"
						// onClick={(e) => handleClick(e, "orders")}
					/>
					<Tab
						value="two"
						label="History"
						// onClick={(e) => handleClick(e, "history")}
					/>
				</Tabs>
			</Box>
		);
	}

	function showNotificationsDisplay() {
		const auth = getAuth();
		const user = auth.currentUser;
		if (!user) {
			return;
		}

		const { numOrdersUnnoticed, errorMessage, orderData } = notifications;
		const {
			numOrdersConfirmed,
			ordersConfirmedErrorMessage,
			ordersConfirmedData,
		} = notificationsConfirmed;
		let count = numOrdersConfirmed + numOrdersUnnoticed;
		let dataArr = [...orderData, ...ordersConfirmedData];

		if (errorMessage) {
			count++;
		}
		if (ordersConfirmedErrorMessage) {
			count++;
		}

		return (
			<ClickAwayListener onClickAway={handleClickAway}>
				<div className={styles.DashHeader__notificationIcon}>
					<IconButton onClick={handleOnClick}>
						<NotificationsNoneIcon sx={{ width: "30px", height: "30px" }} />
						{count !== 0 && (
							<Avatar
								alt="notifications"
								sx={{
									fontSize: "14px",
									bgcolor: "var(--orange)",
									width: "25px",
									height: "25px",
									position: "absolute",
									bottom: "20px",
									left: "25px",
								}}
							>
								{count}
							</Avatar>
						)}
					</IconButton>
					{showNotifications && (
						<NotificationsWeb
							closeNotifications={handleClickAway}
							uid={uid}
							count={count}
							orderData={dataArr}
							orderConfirmErrorMessage={ordersConfirmedErrorMessage}
							orderPendingErrorMessage={errorMessage}
						/>
					)}
				</div>
			</ClickAwayListener>
		);
	}

	return (
		<nav className={styles.DashHeader}>
			<h1>{currentPage}</h1>
			{currentPage === "Orders" && showOrdersLegendAndNav()}
			{showNotificationsDisplay()}
		</nav>
	);
}

export default DashHeader;
