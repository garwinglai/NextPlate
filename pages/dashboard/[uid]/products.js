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
	const [isModalOpen, setIsModalOpen] = useState(false);
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

	const { storedUser, bizId } = user;
	const { loading, errorMessage, isAlertOpen } = handlingResponse;

	const router = useRouter();
	const uid = router.query.uid;

	useEffect(() => {
		const storedUserInfo = JSON.parse(getLocalStorage("user"));
		let bizIdTemp;
		if (storedUserInfo) {
			const bizOwned = storedUserInfo.bizOwned;
			const bizIdArray = Object.keys(bizOwned);
			bizIdTemp = bizIdArray[0];
			setUser({ storedUser: storedUserInfo, bizId: bizIdTemp });
		}

		if (!bizIdTemp) {
			return;
		}

		loadProducts(bizIdTemp);
	}, []);

	async function loadProducts(bizId) {
		setHandlingResponse({ loading: true });
		const productRes = await getProducts(bizId);
		const { success, message, productsArr } = productRes;

		if (success) {
			setHandlingResponse({
				loading: false,
				errorMessage: "",
				isAlertOpen: false,
			});
			setProducts(productsArr);
		} else {
			setHandlingResponse((prev) => ({
				...prev,
				loading: false,
				errorMessage: message,
				isAlertOpen: true,
			}));
		}
	}

	function setResponseError(message) {
		setHandlingResponse((prev) => ({
			...prev,
			errorMessage: message,
			isAlertOpen: true,
		}));
	}

	const handleClickCreate = () => {
		setIsModalOpen((prev) => !prev);
	};

	return (
		<Layout uid={uid} currentPage="Products">
			{isModalOpen && (
				<ProductModal
					isOpen={isModalOpen}
					close={handleClickCreate}
					bizId={bizId}
					loadProducts={loadProducts}
				/>
			)}
			<div className={`${styles.products}`}>
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
			</div>
		</Layout>
	);
}

export default Products;
