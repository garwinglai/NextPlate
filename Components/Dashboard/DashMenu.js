import React, { useEffect, useState, useRef } from "react";
import styles from "../../styles/components/dashboard/dashmenu.module.css";
import Link from "next/link";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { IconButton } from "@mui/material";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import SettingsIcon from "@mui/icons-material/Settings";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Avatar from "@mui/material/Avatar";
import { signOutUser, getLocalStorage } from "../../actions/auth/auth";
import GridViewIcon from "@mui/icons-material/GridView";
import { useRouter } from "next/router";
import CircularProgress from "@mui/material/CircularProgress";
import _ from "lodash";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Image from "next/image";
import LoadingBar from "react-top-loading-bar";

function DashMenu({ currentPage }) {
	const [currentTab, setCurrentTab] = useState("");
	const [userInfo, setUserInfo] = useState({
		fName: "",
		uid: "",
		loading: true,
		initialsCap: "",
	});

	// * ACTIONS ----------------------------------
	const router = useRouter();
	const routerUid = router.query.uid;

	const { fName, loading, uid, initialsCap } = userInfo;

	const loadingBarRef = useRef(null);
	const tabRef = useRef(null);

	useEffect(() => {
		const userData = JSON.parse(getLocalStorage("user"));
		const localStorageUid = JSON.parse(getLocalStorage("uid"));
		const firstName = localStorageUid === routerUid ? userData.firstName : "";
		const lastName = localStorageUid === routerUid ? userData.lastName : "";
		const initials = _.toUpper(firstName.slice(0, 1)).concat(
			_.toUpper(lastName.slice(0, 1))
		);
		const uid = localStorageUid === routerUid ? localStorageUid : "";

		setUserInfo((prev) => ({
			...prev,
			fName: firstName,
			uid,
			loading: false,
			initialsCap: initials,
		}));
		loadingBarRef.current.complete();
	}, [routerUid]);

	async function handleLogOutClick() {
		const { success, message } = await signOutUser();
		if (success) {
			router.push("/business/signin");
		}
	}

	function startProgressBar(e, name) {
		const tabName = e.target.name ? e.target.name : name;

		tabRef.current = tabName;

		if (tabName !== tabRef.current) {
			loadingBarRef.current.continuousStart();
		}
		// setCurrentTab(tabName);
	}

	// * DISPLAY ------------------------------------
	function showMenu() {
		return (
			<menu className={styles.DashMenu_Menu}>
				<LoadingBar
					color="var(--btn-blue)"
					height={3}
					ref={loadingBarRef}
					shadow={true}
				/>
				<div
					style={
						currentPage === "Dashboard"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}`}>
						<a onClick={(e) => startProgressBar(e, "dashboard")}>
							<IconButton>
								<GridViewIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="dashboard"
						>
							Dashboard
						</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Schedule"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/schedule`}>
						<a onClick={(e) => startProgressBar(e, "schedule")}>
							<IconButton>
								<EventNoteIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/schedule`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="schedule"
						>
							Schedule
						</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Orders"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/orders/incoming-orders`}>
						<a onClick={(e) => startProgressBar(e, "incoming-orders")}>
							<IconButton>
								<CreditScoreIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/orders/incoming-orders`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="incoming-orders"
						>
							Orders
						</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Payments"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/payments`}>
						<a onClick={(e) => startProgressBar(e, "payments")}>
							<IconButton>
								<AccountBalanceIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/payments`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="payments"
						>
							Payments
						</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Account"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/account`}>
						<a onClick={(e) => startProgressBar(e, "account")}>
							<IconButton>
								<AccountBoxIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/account`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="account"
						>
							Account
						</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Settings"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/settings`}>
						<a onClick={(e) => startProgressBar(e, "settings")}>
							<IconButton>
								<SettingsIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/settings`}>
						<a
							className={styles.DashMenu_MenuItems}
							onClick={startProgressBar}
							name="settings"
						>
							Settings
						</a>
					</Link>
				</div>
			</menu>
		);
	}

	return (
		<nav className={styles.DashMenu}>
			<div className={styles.DashMenu_CenterContainer}>
				<div className={styles.DashMenu_TitleContainer}>
					<Image
						priority={true}
						src="/images/NP_White.png"
						alt="logo"
						width="100px"
						height="40px"
					/>

					<Avatar
						sx={{
							color: "black",
							backgroundColor: "var(--med-blue)",
							fontSize: "14px",
							marginTop: "30px",
						}}
					>
						{initialsCap}
					</Avatar>
					{loading ? (
						<div className={styles.DashMenu_UserName}>
							<CircularProgress />
						</div>
					) : (
						<h3 className={styles.DashMenu_UserName}>Hello, {fName}</h3>
					)}
				</div>
				{showMenu()}
			</div>
			<div className={styles.Logout_Container}>
				<IconButton sx={{ fontSize: 16 }} onClick={handleLogOutClick}>
					<PowerSettingsNewIcon sx={{ color: "var(--gray)" }} />
					<p className={styles.DashMenu_Logout}>Logout</p>
				</IconButton>
			</div>
		</nav>
	);
}

export default DashMenu;
