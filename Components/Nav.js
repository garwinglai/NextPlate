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

function Nav({ currentPage, notifications }) {
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
	// const { numOrdersUnoticed, orderData } = notifications;
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
			if (
				notifications &&
				notifications.numOrdersUnoticed !== 0 &&
				notifications.orderData.length !== 0
			) {
				setMobileNav((prev) => ({ ...prev, showNotifications: true }));
			}
		} else {
			setIsLoggedIn(false);
		}
	}, [notifications, uid]);

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
				<Link href="/business/signin">
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

	function mobileDashboardNav() {
		const { numOrdersUnnoticed, errorMessage, orderData } = notifications;
		return (
			<ClickAwayListener onClickAway={handleClickAway}>
				<div>
					<div className={styles.Nav__dashboardMobile}>
						<MenuIcon name="hamburger" onClick={handleBurgerClick} />
						<Link href={`/dashboard/${uid}`}>
							<a>
								<h3>Hello, {fName}</h3>
							</a>
						</Link>
						{numOrdersUnnoticed !== 0 && (
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
								{numOrdersUnnoticed}
							</Avatar>
						)}
						<NotificationsNoneIcon
							name="notifications"
							onClick={handleNotificationsClick}
							sx={{ width: "30px", height: "30px" }}
						/>
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
							orderData={orderData}
							handleClickAway={handleClickAway}
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
					currentPage === "Account" ||
					currentPage === "Settings") &&
					mobileDashboardNav()}
			</nav>
		</React.Fragment>
	);
}

export default Nav;
