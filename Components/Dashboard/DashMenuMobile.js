import React, { useState, useEffect } from "react";
import styles from "../../styles/components/dashboard/dashmenumobile.module.css";
import Link from "next/link";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { IconButton } from "@mui/material";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import SettingsIcon from "@mui/icons-material/Settings";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/router";
import { getLocalStorage, signOutUser } from "../../actions/auth/auth";
import CircularProgress from "@mui/material/CircularProgress";
import GridViewIcon from "@mui/icons-material/GridView";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

function DashMenuMobile({ currentPage, closeMenu }) {
	const [userInfo, setUserInfo] = useState({
		fName: "",
		uid: "",
		loading: true,
	});

	// * ACTIONS ----------------------------------
	const router = useRouter();
	const routerUid = router.query.uid;

	const { fName, loading, uid } = userInfo;

	useEffect(() => {
		const userData = JSON.parse(getLocalStorage("user"));
		const localStorageUid = JSON.parse(getLocalStorage("uid"));
		const firstName = localStorageUid === routerUid ? userData.firstName : "";
		const uid = localStorageUid === routerUid ? localStorageUid : "";
		setUserInfo((prev) => ({ ...prev, fName: firstName, uid, loading: false }));
	}, [routerUid]);

	// * ACTIONS ----------------------------------

	async function handleLogOutClick(e) {
		const { success, message } = await signOutUser();
		if (success) {
			router.push("/business/signin");
		}
	}

	// * DISPLAY ------------------------------------
	function showMenu() {
		return (
			<menu className={styles.DashMenuMobile_Menu}>
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
						<a>
							<IconButton>
								<GridViewIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}`}>
						<a className={styles.DashMenuMobile_MenuItems}>Dashboard</a>
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
						<a>
							<IconButton>
								<EventNoteIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/schedule`}>
						<a className={styles.DashMenuMobile_MenuItems}>Schedule</a>
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
						<a>
							<IconButton>
								<CreditScoreIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/orders/incoming-orders`}>
						<a className={styles.DashMenuMobile_MenuItems}>Orders</a>
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
						<a>
							<IconButton>
								<AccountBalanceIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/payments`}>
						<a className={styles.DashMenuMobile_MenuItems}>Payments</a>
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
						<a>
							<IconButton>
								<AccountBoxIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/account`}>
						<a className={styles.DashMenuMobile_MenuItems}>Account</a>
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
						<a>
							<IconButton>
								<SettingsIcon sx={{ color: "var(--gray)" }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/settings`}>
						<a className={styles.DashMenuMobile_MenuItems}>Settings</a>
					</Link>
				</div>
			</menu>
		);
	}

	return (
		<div className={styles.DashMenuMobile}>
			<div className={styles.DashMenuMobile_CenterContainer}>
				<IconButton
					onClick={closeMenu}
					sx={{ color: "lightgray" }}
					className={styles.DashMenuMobile_closeIconContainer}
				>
					<CloseIcon className={styles.DashMenuMobile_closeIcon} />
				</IconButton>
				<div className={styles.DashMenuMobile_TitleContainer}>
					<h4 className={styles.DashMenuMobile_Logo}>Next Plate</h4>
					<Avatar>GL</Avatar>
					{loading ? (
						<div className={styles.DashMenuMobile_UserName}>
							<CircularProgress />
						</div>
					) : (
						<h3 className={styles.DashMenuMobile_UserName}>Hello, {fName}</h3>
					)}
				</div>
				{showMenu()}
			</div>
			<div className={styles.Logout_Container}>
				<IconButton sx={{ fontSize: 16 }} onClick={handleLogOutClick}>
					<PowerSettingsNewIcon sx={{ color: "var(--gray)" }} />
					<p className={styles.DashMenuMobile_Logout}>Logout</p>
				</IconButton>
			</div>
		</div>
	);
}

export default DashMenuMobile;
