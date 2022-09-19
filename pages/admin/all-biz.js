import React, { useEffect, useState } from "react";
import Layout from "../../Components/Layout";
import UserCard from "../../Components/Admin/UserCard";
import {
	getAllBizUserInfo,
	queryBizUser,
	getBizAdminPagination,
} from "../../actions/crud/bizUser";
import styles from "../../styles/pages/admin/all.module.css";
import Admin from "../../Components/Admin";

function AllBiz() {
	const [bizDataArr, setBizDataArr] = useState([]);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [queriedData, setQueriedData] = useState([]);
	const [fetchingQuery, setFetchingQuery] = useState(false);
	const [fetchMessage, setFetchMessage] = useState("");
	const [pagination, setPagination] = useState({
		lastPage: false,
		pageCount: 1,
		lastDoc: {},
		prevDoc: {},
	});

	const { lastPage, pageCount, lastDoc, prevDoc } = pagination;

	useEffect(() => {
		setLoading(true);
		loadBizUsers();
	}, []);

	// * UseEffect Actions ---------------------

	async function loadBizUsers() {
		let data = await getAllBizUserInfo();
		if (data.success) {
			const dataArr = data.bizArr;
			setLoading(false);
			setBizDataArr(data.bizArr);
			setPagination((prev) => ({
				...prev,
				lastDoc: dataArr[dataArr.length - 1][0].name,
			}));
		} else {
			setLoading(false);
			setMessage(data.message);
		}
	}

	// * Page Actions ------------------------------------
	async function handleSearchClick(e, searchQuery) {
		setFetchingQuery(true);

		const lowerCaseQuery = _.toLower(searchQuery);

		if (searchQuery !== null || searchQuery !== "") {
			const res = await queryBizUser(lowerCaseQuery);
			if (res.success) {
				setFetchingQuery(false);
				setQueriedData(res.queryBizArray);
			} else {
				setFetchingQuery(false);
				setFetchMessage(res.message);
			}
		} else {
			await loadBizUsers();
		}
	}

	async function handlePagination(e) {
		const { name } = e.target;
		setLoading(true);

		if (name === "prev") {
			let resBizes;
			if (lastPage) {
				resBizes = await getBizAdminPagination("last", prevDoc);
			} else {
				resBizes = await getBizAdminPagination(name, prevDoc);
			}

			if (resBizes.success) {
				const bizArr = resBizes.businessArr;
				setLoading(false);
				setBizDataArr(bizArr);
				setFetchMessage("");
				setPagination((prev) => ({
					...prev,
					pageCount: prev.pageCount - 1,
					lastDoc: bizArr[bizArr.length - 1][0].name,
					prevDoc: bizArr[0][0].name,
					lastPage: false,
				}));
			} else {
				setLoading(false);
				setFetchMessage(resBizes.message);
			}
		}

		if (name === "next") {
			const resBizes = await getBizAdminPagination(name, lastDoc);

			if (resBizes.success) {
				const bizArr = resBizes.businessArr;

				if (bizArr && bizArr.length !== 0) {
					setLoading(false);
					setBizDataArr(bizArr);
					setPagination((prev) => ({
						pageCount: prev.pageCount + 1,
						lastDoc: bizArr[bizArr.length - 1][0].name,
						prevDoc: bizArr[0][0].name,
					}));
				} else {
					setLoading(false);
					setBizDataArr([]);
					setPagination((prev) => ({
						pageCount: prev.pageCount + 1,
						lastPage: true,
						prevDoc: lastDoc,
					}));
					setFetchMessage("No more orders.");
				}
			} else {
				setLoading(false);
				setFetchMessage(resBizes.message);
			}
		}
	}

	function handleSearchChange(e) {
		const { value } = e.target;
		setSearchQuery(value);
	}

	return (
		<Layout currentPage="admin">
			<Admin>
				{loading && <p>Loading businesses...</p>}
				{message && <p>{message}</p>}
				<div className={styles.All__searchContainer}>
					<input
						type="text"
						placeholder="search"
						value={searchQuery}
						onChange={handleSearchChange}
					/>
					<button
						name="search"
						onClick={(e) => handleSearchClick(e, searchQuery)}
					>
						Search
					</button>
				</div>

				{fetchMessage !== "" ? (
					<p>{fetchMessage}</p>
				) : queriedData.length !== 0 ? (
					queriedData.map((biz, idx) => {
						return <UserCard data={biz} key={biz.bizId} />;
					})
				) : fetchingQuery ? (
					<p>Loading...</p>
				) : bizDataArr.length !== 0 ? (
					bizDataArr.map((biz, idx) => {
						return <UserCard data={biz} key={biz.bizId} />;
					})
				) : (
					<p>No business</p>
				)}
				<div
					style={{
						width: "100%",
						display: "flex",
						justifyContent: "center",
						gap: "10px",
					}}
				>
					<button
						disabled={pageCount === 1}
						name="prev"
						type="button"
						onClick={handlePagination}
						style={{ width: "50px", height: "30px" }}
					>
						prev
					</button>
					<button
						disabled={lastPage ? true : bizDataArr.length === 10 ? false : true}
						name="next"
						type="button"
						onClick={handlePagination}
						style={{ width: "50px", height: "30px" }}
					>
						next
					</button>
				</div>
			</Admin>
		</Layout>
	);
}

export default AllBiz;
