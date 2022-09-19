import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import { getLocalStorage } from "../../../actions/auth/auth";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { CircularProgress } from "@mui/material";
import { Button, Grid } from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import styles from "../../../styles/pages/dashboard/test.module.css";
import TestOrdersComponent from "../../../Components/Dashboard/Test/TestOrdersComponent";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	width: "max-content",
	transform: "translate(-50%, -50%)",
	bgcolor: "background.paper",
	border: "2px solid var(--gray)",
	boxShadow: 24,
	p: 4,
	borderRadius: "5px",
};

const styleNotification = {
	position: "absolute",
	width: "100%",
	height: "100%",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
};

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

function Test() {
	// * Tab Values
	const [value, setValue] = useState(0);
	const [audio, setAudio] = useState(null);
	const [open, setOpen] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [testScheduleValues, setTestScheduleValues] = useState({
		numAvailable: "1",
		numHours: "1",
		itemName: "Surprise Bag",
		pendingCount: 0,
		pendingArray: [],
		confirmedCount: 0,
		confirmedArray: [],
		statusIndexPending: 0,
		statusIndexConfirmed: 1,
		statusPending: "Reserved",
		statusConfirmed: "Confirmed",
	});
	const [twoDates, setTwoDates] = useState([
		{
			weekDayNameShort: "",
			shortDate: "",
			statusTodayOrTomorrow: 0,
			actualDate: "",
			dayIndex: "",
		},
	]);

	const {
		numAvailable,
		numHours,
		itemName,
		pendingCount,
		pendingArray,
		confirmedCount,
		confirmedArray,
		statusIndexPending,
		statusIndexConfirmed,
		statusPending,
		statusConfirmed,
	} = testScheduleValues;
	const arrayOfTwenty = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		if (audio === null) {
			setAudio(new Audio("/sounds/smsTone.mp3"));
		}

		loadDates();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function loadDates() {
		const dateArr = [];

		for (let i = 0; i < 2; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			const weekDayIndex = date.getDay() + 1;
			let tempData = {};
			tempData.shortDate = date.toLocaleDateString();
			tempData.statusTodayOrTomorrow = i;
			tempData.actualDate = date.toDateString();
			tempData.dayIndex = weekDayIndex;

			switch (weekDayIndex) {
				case 1:
					tempData.weekDayNameShort = "Sun";
					break;
				case 2:
					tempData.weekDayNameShort = "Mon";
					break;
				case 3:
					tempData.weekDayNameShort = "Tue";
					break;
				case 4:
					tempData.weekDayNameShort = "Wed";
					break;
				case 5:
					tempData.weekDayNameShort = "Thur";
					break;
				case 6:
					tempData.weekDayNameShort = "Fri";
					break;
				case 7:
					tempData.weekDayNameShort = "Sat";
					break;
				default:
					break;
			}

			dateArr.push(tempData);
		}
		setTwoDates(dateArr);
	}

	// * Displays ---------------------------------------------------------------
	function showScheduleNowModal() {
		const date = new Date();
		const currHour = date.getHours();
		const currMin = date.getMinutes();

		let disable1Hr = false;
		let disable2Hr = false;

		if (currHour === 22) {
			if (currMin > 0) {
				disable2Hr = true;
			}
		}

		if (currHour === 23) {
			disable2Hr = true;
			if (currMin > 0) {
				disable1Hr = true;
			}
		}

		return (
			<Modal
				open={showModal}
				onClose={() => setShowModal(false)}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div
						className={`${styles.ScheduleModal__container} ${styles.flexCol}`}
					>
						<div className={` ${styles.Schedule__meals}`}>
							<h3 className={`${styles.titleGap} ${styles.numMealGroup}`}>
								How many meals?
							</h3>
							{arrayOfTwenty.map((num, idx) => {
								return (
									<React.Fragment key={idx}>
										<input
											className={`${styles.radios}`}
											id={num}
											type="radio"
											checked={numAvailable === num}
											value={num}
											onChange={handleFlashChange}
											name="numAvailable"
											required
										/>
										<label
											htmlFor={num}
											className={`${styles.mealLabels} ${
												numAvailable === num ? styles.labelsChecked : undefined
											}`}
										>
											{num}
										</label>
									</React.Fragment>
								);
							})}
						</div>
						<div className={`${styles.Schedule__scheduleModal}`}>
							<div className={`${styles.flexRow} ${styles.hourTitleGroup}`}>
								<h3 className={`${styles.titleGap}`}>How many hours?</h3>
								<p className={`${styles.Description} ${styles.titleGap}`}>
									(12 am - 11:45 pm)
								</p>
							</div>
							<div className={`${styles.RadioGroup} ${styles.flexRow} `}>
								<input
									className={`${styles.radios}`}
									id="one"
									type="radio"
									disabled={disable1Hr}
									checked={numHours === "1"}
									value={1}
									onChange={handleFlashChange}
									name="numHours"
								/>
								<label
									htmlFor="one"
									className={`${styles.labels} 
									 ${
											disable1Hr
												? styles.hourDisabled
												: numHours === "1"
												? styles.labelsChecked
												: undefined
										}`}
								>
									1 hr
								</label>

								<input
									className={`${styles.radios}`}
									id="two"
									type="radio"
									disabled={disable2Hr}
									checked={numHours === "2"}
									value={2}
									onChange={handleFlashChange}
									name="numHours"
								/>
								<label
									htmlFor="two"
									className={`${styles.labels}  ${
										numHours === "2" ? styles.labelsChecked : undefined
									} ${disable2Hr ? styles.hourDisabled : undefined}`}
								>
									2 hr
								</label>
							</div>
						</div>
						<div className={`${styles.flexCol} ${styles.selectItemGroup}`}>
							<h3 className={`${styles.titleGap}`}>Select item:</h3>
							<div className={`${styles.flexRow} ${styles.itemGroup}`}>
								<React.Fragment>
									<input
										className={`${styles.radios}`}
										id="product"
										checked={itemName === "Surprise Bag"}
										type="radio"
										name="itemName"
										value={"Surprise Bag"}
										onChange={handleFlashChange}
									/>
									<label
										htmlFor="product"
										className={`${styles.labels} ${
											itemName === "Surprise Bag"
												? styles.labelsChecked
												: undefined
										}`}
									>
										Surprise Bag
									</label>
								</React.Fragment>
							</div>
						</div>

						<Button
							variant={"contained"}
							size="large"
							disabled={disable1Hr}
							onClick={handleCreateNow}
							color={"primary"}
						>
							{"+ Create"}
						</Button>
					</div>
				</Box>
			</Modal>
		);
	}

	function showIncomingOrderModal() {
		return (
			<div>
				<Modal
					open={open}
					onClose={handleClose}
					aria-labelledby="modal-modal-title"
					aria-describedby="modal-modal-description"
				>
					<Box
						sx={styleNotification}
						onClick={() => {
							handleClose();
							playNotificationSound(audio, "end");
							router.push(`/dashboard/${uid}/test`);
						}}
						className={styles.Box}
					>
						<div className={styles.BoxContent}>
							<h1>{pendingCount}</h1>
							<div className={styles.BoxDescription}>
								<h2>Test Order</h2>
								<p>Tap to view test order</p>
							</div>
						</div>
					</Box>
				</Modal>
			</div>
		);
	}

	// * ACTIONS -------------------

	function handleCreateNow() {
		setTestScheduleValues((prev) => ({
			...prev,
			pendingCount: (prev.pendingCount += 1),
			pendingArray: [...prev.pendingArray, prev.pendingCount],
		}));
		setShowModal(false);
		setOpen(true);
		playNotificationSound(audio, "start");
	}

	function handleFlashChange(e) {
		const { name, value } = e.target;
		setTestScheduleValues((prev) => ({ ...prev, [name]: value }));
	}

	function handleScheduleNow(e) {
		setShowModal((prev) => !prev);
	}

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	function handleClose() {
		setOpen(false);
	}

	function handleAction(name) {
		if (name === "accept") {
			const pendingArrayUpdate = pendingArray.slice(0, pendingArray.length - 1);

			setTestScheduleValues((prev) => ({
				...prev,
				pendingCount: (prev.pendingCount -= 1),
				pendingArray: pendingArrayUpdate,
				confirmedCount: (prev.confirmedCount += 1),
				confirmedArray: [...prev.confirmedArray, prev.confirmedCount],
			}));
			handleClose();
			return;
		}
		if (name === "complete") {
			const confirmedArrayUpdate = confirmedArray.slice(
				0,
				confirmedArray.length - 1
			);

			setTestScheduleValues((prev) => ({
				...prev,
				confirmedCount: (prev.confirmedCount -= 1),
				confirmedArray: confirmedArrayUpdate,
			}));
			handleClose();
			return;
		}

		if (name === "decline") {
			const pendingArrayUpdate = pendingArray.slice(0, pendingArray.length - 1);

			setTestScheduleValues((prev) => ({
				...prev,
				pendingCount: (prev.pendingCount -= 1),
				pendingArray: pendingArrayUpdate,
			}));
			handleClose();
			return;
		}

		if (name === "cancel") {
			const confirmedArrayUpdate = confirmedArray.slice(
				0,
				confirmedArray.length - 1
			);

			setTestScheduleValues((prev) => ({
				...prev,

				confirmedCount: (prev.confirmedCount -= 1),
				confirmedArray: confirmedArrayUpdate,
			}));
			handleClose();
			return;
		}
	}

	return (
		<Layout uid={uid} currentPage="Test mode">
			<div className={styles.IncomingOrders__container}>
				<Button variant="contained" onClick={handleScheduleNow}>
					⚡️ Flash Sale
				</Button>
				{showIncomingOrderModal()}
				{showScheduleNowModal()}
				<Box sx={{ width: "100%" }}>
					<Box
						sx={{
							borderBottom: 1,
							borderColor: "divider",
							width: "100%",
						}}
					>
						<div className={styles.tab__container}>
							<Tabs
								value={value}
								onChange={handleChange}
								aria-label="basic tabs example"
								className={styles.tab__Group}
							>
								<Tab label="Pending" {...a11yProps(0)} className={styles.tab} />
								<Tab label="Pickup" {...a11yProps(1)} className={styles.tab} />
							</Tabs>
							{pendingCount !== 0 ? (
								<p className={`${styles.pendingCount}`}>{pendingCount}</p>
							) : (
								<p style={{ display: "none" }}>hidden</p>
							)}
							{confirmedCount !== 0 ? (
								<p className={`${styles.confirmedCount}`}>{confirmedCount}</p>
							) : (
								<p style={{ display: "none" }}>hidden</p>
							)}
						</div>
					</Box>

					<TabPanel value={value} index={0}>
						<TestOrdersComponent
							date={twoDates[0]}
							tab={0}
							pendingArray={pendingArray}
							statusIndex={statusIndexPending}
							status={statusPending}
							handleAction={handleAction}
						/>
					</TabPanel>
					<TabPanel value={value} index={1}>
						<TestOrdersComponent
							date={twoDates[0]}
							tab={1}
							confirmedArray={confirmedArray}
							statusIndex={statusIndexConfirmed}
							status={statusConfirmed}
							handleAction={handleAction}
						/>
					</TabPanel>
				</Box>
			</div>
		</Layout>
	);
}

export default Test;

function playNotificationSound(audio, action) {
	if (!audio) {
		return;
	}
	if (action === "start") {
		audio.play();
		audio.loop = true;
	}

	if (action === "end") {
		audio.pause();
		audio.currentTime = 0;
	}
}
