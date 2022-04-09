import React, { useState, useEffect } from "react";
import styles from "../../styles/components/dashboard/dashmenumobile.module.css";
import Link from "next/link";
import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CreditScoreIcon from "@mui/icons-material/CreditScore";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import { useRouter } from "next/router";
import { getLocalStorage, signOutUser } from "../../actions/auth/auth";
import CircularProgress from "@mui/material/CircularProgress";
import GridViewIcon from "@mui/icons-material/GridView";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CategoryIcon from "@mui/icons-material/Category";
import ScienceIcon from "@mui/icons-material/Science";
import Version from "../Misc/Version";

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
								<GridViewIcon sx={{ color: "var(--gray)", fontSize: 35 }} />
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
								<EventNoteIcon sx={{ color: "var(--gray)", fontSize: 30 }} />
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
								<CreditScoreIcon sx={{ color: "var(--gray)", fontSize: 35 }} />
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
								<AccountBalanceIcon
									sx={{ color: "var(--gray)", fontSize: 35 }}
								/>
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/payments`}>
						<a className={styles.DashMenuMobile_MenuItems}>Payments</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Products"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/products`}>
						<a>
							<IconButton>
								<CategoryIcon sx={{ color: "var(--gray)", fontSize: 35 }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/products`}>
						<a className={styles.DashMenuMobile_MenuItems}>Products</a>
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
								<SettingsIcon sx={{ color: "var(--gray)", fontSize: 35 }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/settings`}>
						<a className={styles.DashMenuMobile_MenuItems}>Settings</a>
					</Link>
				</div>
				<div
					style={
						currentPage === "Test mode"
							? {
									backgroundColor: "var(--dark-blue)",
									borderRadius: "5px",
							  }
							: undefined
					}
				>
					<Link href={`/dashboard/${routerUid}/test`}>
						<a>
							<IconButton>
								<ScienceIcon sx={{ color: "var(--gray)", fontSize: 35 }} />
							</IconButton>
						</a>
					</Link>
					<Link href={`/dashboard/${routerUid}/test`}>
						<a className={styles.DashMenuMobile_MenuItems}>Test Mode</a>
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
					{/* <h4 className={styles.DashMenuMobile_Logo}>NextPlate</h4>
					<Avatar>GL</Avatar>
					{loading ? (
						<div className={styles.DashMenuMobile_UserName}>
							<CircularProgress />
						</div>
					) : (
						<h3 className={styles.DashMenuMobile_UserName}>Hello, {fName}</h3>
					)} */}
				</div>
				{showMenu()}
			</div>

			<Version route="mobile" />
		</div>
	);
}

export default DashMenuMobile;
