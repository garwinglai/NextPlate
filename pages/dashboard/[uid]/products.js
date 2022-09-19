import React, { useState, useEffect } from "react";
import Layout from "../../../Components/Layout";
import { useRouter } from "next/router";
import { getLocalStorage } from "../../../actions/auth/auth";
import styles from "../../../styles/pages/dashboard/products.module.css";
import { Button } from "@mui/material";
import getProducts from "../../../actions/dashboard/productsCrud";
import ProductCard from "../../../Components/Dashboard/Product/ProductCard";
import ProductModal from "../../../Components/Dashboard/Product/ProductModal";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";

function Products() {
	const [modalOpen, setIsModalOpen] = useState({
		isModalOpen: false,
		currBizId: "",
		businessesOwned: {},
	});
	const [user, setUser] = useState({
		storedUser: {},
		bizId: "",
	});
	const [handlingResponse, setHandlingResponse] = useState({
		loading: false,
		errorMessage: "",
		isAlertOpen: true,
	});
	const [products, setProducts] = useState([]);

	const { isModalOpen, currBizId, businessesOwned } = modalOpen;
	const { storedUser, bizId } = user;
	const { loading, errorMessage, isAlertOpen } = handlingResponse;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUserInfo = JSON.parse(getLocalStorage("user"));
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

			setIsModalOpen((prev) => ({ ...prev, businessesOwned: bizOwned }));
		}

		if (bizIdArr.length === 0) {
			return;
		}

		loadProducts(bizIdArr, bizOwned);
	}, []);

	const loadProducts = async (bizIdArr, bizOwned) => {
		setHandlingResponse({ loading: true });

		const allProducts = [];

		for (let i = 0; i < bizIdArr.length; i++) {
			const businessId = bizIdArr[i];
			const bizName = bizOwned[businessId].name;
			const productRes = await getProducts(businessId);
			const { success, message, productsArr } = productRes;

			if (success) {
				const bizProducts = {
					bizName,
					businessId,
					products: productsArr,
				};

				allProducts.push(bizProducts);
			} else {
				console.log("error loading products");
				setHandlingResponse((prev) => ({
					...prev,
					loading: false,
					errorMessage: message,
					isAlertOpen: true,
				}));

				return;
			}
		}

		setHandlingResponse({
			loading: false,
			errorMessage: "",
			isAlertOpen: false,
		});

		setProducts(allProducts);
	};

	function setResponseError(message) {
		setHandlingResponse((prev) => ({
			...prev,
			errorMessage: message,
			isAlertOpen: true,
		}));
	}

	const handleClickCreate = (e, currBusinessId) => {
		setIsModalOpen((prev) => ({
			...prev,
			isModalOpen: !prev.isModalOpen,
			currBizId: currBusinessId ? currBusinessId : "",
		}));
	};

	return (
		<Layout uid={uid} currentPage="Products">
			{isModalOpen && (
				<ProductModal
					isOpen={isModalOpen}
					close={handleClickCreate}
					bizId={currBizId}
					bizIdArr={bizId}
					bizOwned={businessesOwned}
					loadProducts={loadProducts}
					product={null}
				/>
			)}
			{products.map((product) => {
				return (
					<div className={`${styles.products}`} key={product.businessId}>
						<div className={`${styles.header} ${styles.flexRow}`}>
							<div>
								<h2>{product.bizName}</h2>
								<h4>({product.products.length} items)</h4>
							</div>

							{errorMessage && (
								<Collapse in={isAlertOpen}>
									<Alert
										severity="error"
										onClose={() => {
											setHandlingResponse((prev) => ({
												...prev,
												isAlertOpen: false,
											}));
										}}
										sx={{ width: "90%" }}
									>
										<p style={{ wordBreak: "break-word" }}> {errorMessage}</p>
									</Alert>
								</Collapse>
							)}
							<div className={`${styles.btn__container}`}>
								<Button
									variant="contained"
									onClick={(e) => {
										handleClickCreate(e, product.businessId);
									}}
								>
									+ Create
								</Button>
							</div>
						</div>
						<div className={`${styles.body} ${styles.flexRow}`}>
							{product.products.map((item) => {
								return (
									<ProductCard
										key={item.id}
										product={item}
										bizId={product.businessId}
										bizIdArr={bizId}
										bizOwned={businessesOwned}
										loadProducts={loadProducts}
										setResponseError={setResponseError}
									/>
								);
							})}
						</div>
					</div>
				);
			})}
			{/* <div className={`${styles.products}`}>
				<div className={`${styles.header} ${styles.flexRow}`}>
					<h2>{products.length} items</h2>
					{errorMessage && (
						<Collapse in={isAlertOpen}>
							<Alert
								severity="error"
								onClose={() => {
									setHandlingResponse((prev) => ({
										...prev,
										isAlertOpen: false,
									}));
								}}
								sx={{ width: "90%" }}
							>
								<p style={{ wordBreak: "break-word" }}> {errorMessage}</p>
							</Alert>
						</Collapse>
					)}
					<div className={`${styles.btn__container}`}>
						<Button variant="contained" onClick={handleClickCreate}>
							+ Create
						</Button>
					</div>
				</div>
				<div className={`${styles.body} ${styles.flexRow}`}>
					{products.map((product) => {
						return (
							<ProductCard
								key={product.id}
								product={product}
								bizId={bizId}
								loadProducts={loadProducts}
								setResponseError={setResponseError}
							/>
						);
					})}
				</div>
			</div> */}
		</Layout>
	);
}

export default Products;
