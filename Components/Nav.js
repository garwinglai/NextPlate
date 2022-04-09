import React, { useEffect, useState } from "react";
import styles from "../styles/components/nav.module.css";
import { useRouter } from "next/router";
import Link from "next/link";
import { isAuth, signOutUser, getLocalStorage } from "../actions/auth/auth";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MenuIcon from "@mui/icons-material/Menu";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import DashMenuMobile from "./Dashboard/DashMenuMobile";
import NotificationsMobile from "./Dashboard/Notifications/NotificationsMobile";
import { Avatar } from "@mui/material";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import { IconButton } from "@mui/material";

function Nav({ currentPage, notifications, notificationsConfirmed }) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [mobileNav, setMobileNav] = useState({
		showHamburger: false,
		showNotifications: false,
	});
	const [userInfo, setUserInfo] = useState({
		fName: "",
		loading: true,
	});

	const { fName, loading } = userInfo;
	const { showHamburger, showNotifications } = mobileNav;

	const router = useRouter();
	const uid = router.query.uid;

	const ModalBackgroundStyle = {
		opcacity: "0.5",
	};

	async function handleSignOut() {
		await signOutUser();
		router.push("/admin/signin");
	}

	useEffect(() => {
		if (isAuth()) {
			setIsLoggedIn(true);
			const userData = JSON.parse(getLocalStorage("user"));
			const localStorageUid = JSON.parse(getLocalStorage("uid"));
			const firstName = localStorageUid === uid ? userData.firstName : "";

			setUserInfo((prev) => ({
				...prev,
				fName: firstName,
				loading: false,
			}));
		} else {
			setIsLoggedIn(false);
		}
	}, [uid]);

	// * ADMIN NAV -----------------------------------

	function adminNav() {
		return (
			<div className={styles.Nav__admin}>
				<Link href="/admin">
					<a>
						<Image
							priority={true}
							src="/images/NP_Black.png"
							alt="logo"
							width="170px"
							height="60px"
						/>
					</a>
				</Link>
				<div className={styles.Nav__adminRightActions}>
					{!isLoggedIn && (
						<Link href="/admin/signin">
							<a>
								<button>Sign In</button>
							</a>
						</Link>
					)}
					{isLoggedIn && (
						<Link href="/admin">
							<a>
								<button>Home</button>
							</a>
						</Link>
					)}
					{isLoggedIn && <button onClick={handleSignOut}>Sign out</button>}
				</div>
			</div>
		);
	}

	// * AUTH & LANDING NAV -----------------------------------

	function authAndLandingNav() {
		return (
			<div className={styles.Nav__user}>
				<Link href="https://www.home.nextplate.app/">
					<a>
						<Image
							priority={true}
							src="/images/NP_Black.png"
							alt="logo"
							width="170px"
							height="60px"
						/>
					</a>
				</Link>
			</div>
		);
	}

	// * MOBILE NAV -----------------------------------

	// * ACTIONS
	function handleBurgerClick() {
		setMobileNav((prev) => ({
			showNotifications: false,
			showHamburger: !prev.showHamburger,
		}));
	}

	function handleNotificationsClick() {
		setMobileNav((prev) => ({
			showHamburger: false,
			showNotifications: !prev.showNotifications,
		}));
	}

	function handleClickAway() {
		setMobileNav({
			showHamburger: false,
			showNotifications: false,
		});
	}

	// * DISPLAY

	function mobileDashboardNav(currentPage) {
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
				<div>
					<div className={styles.Nav__dashboardMobile}>
						<IconButton sx={{ padding: "20px" }} onClick={handleBurgerClick}>
							<MenuIcon
								name="hamburger"
								sx={{
									color: "white",
									width: "40px",
									height: "40px",
									["@media (max-width:480px)"]: {
										// eslint-disable-line no-useless-computed-key
										width: "30px",
										height: "30px",
									},
									// padding: "10px",
								}}
							/>
						</IconButton>
						<Link href={`/dashboard/${uid}`}>
							<a style={{ padding: "0", margin: "0" }}>
								<Image
									priority={true}
									src="/images/NP_White.png"
									alt="logo"
									width="150px"
									height="60px"
								/>
							</a>
						</Link>
						{count !== 0 && (
							<Avatar
								alt="notifications"
								sx={{
									bgcolor: "var(--orange)",
									width: "30px",
									height: "30px",
									position: "absolute",
									bottom: "30px",
									right: "30px",
								}}
							>
								{count}
							</Avatar>
						)}
						<IconButton
							sx={{ padding: "20px" }}
							onClick={handleNotificationsClick}
						>
							<NotificationsNoneIcon
								name="notifications"
								sx={{
									width: "40px",
									height: "40px",
									color: "white",
									["@media (max-width:480px)"]: {
										// eslint-disable-line no-useless-computed-key
										width: "30px",
										height: "30px",
									},
								}}
							/>
						</IconButton>
					</div>
					{showHamburger && (
						<DashMenuMobile
							currentPage={currentPage}
							closeMenu={handleBurgerClick}
						/>
					)}
					{showNotifications && (
						<NotificationsMobile
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
		<React.Fragment>
			<nav>
				{currentPage === "admin" && adminNav()}
				{currentPage === "public" && authAndLandingNav()}
				{(currentPage === "Dashboard" ||
					currentPage === "Schedule" ||
					currentPage === "Orders" ||
					currentPage === "Payments" ||
					currentPage === "Products" ||
					currentPage === "Settings" ||
					currentPage === "Test mode") &&
					mobileDashboardNav(currentPage)}
			</nav>
		</React.Fragment>
	);
}

export default Nav;
