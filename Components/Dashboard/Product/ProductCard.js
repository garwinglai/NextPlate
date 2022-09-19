import React, { useState } from "react";
import styles from "../../../styles/components/dashboard/product/product-card.module.css";
import { Button } from "@mui/material";
import { deleteProduct } from "../../../actions/dashboard/productsCrud";
import ProductModal from "./ProductModal";

function ProductCard({
	product,
	bizId,
	bizIdArr,
	bizOwned,
	loadProducts,
	setResponseError,
}) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		itemName,
		itemDescription,
		isDefault,
		allergens,
		originalPrice,
		defaultPrice,
		id,
	} = product;

	async function handleClick(e) {
		const { name } = e.target;
		if (name === "delete") {
			const deleteProductRes = await deleteProduct(bizId, id);
			const { success, message } = deleteProductRes;
			if (success) {
				await loadProducts(bizIdArr, bizOwned);
			} else {
				setResponseError(message);
			}
		}

		if (name === "edit") {
			setIsModalOpen((prev) => !prev);
		}
	}

	function closeModal() {
		setIsModalOpen((prev) => !prev);
	}

	return (
		<div className={`${styles.productCard} ${styles.flexCol}`}>
			<ProductModal
				isOpen={isModalOpen}
				close={closeModal}
				bizId={bizId}
				bizIdArr={bizIdArr}
				bizOwned={bizOwned}
				loadProducts={loadProducts}
				product={product}
			/>
			<div className={`${styles.bodyContainer} ${styles.flexCol}`}>
				<div className={`${styles.body} ${styles.flexCol}`}>
					<h4>{itemName}</h4>
					<div className={`${styles.flexRow} ${styles.prices}`}>
						<p className={`${styles.originalPrice}`}>{originalPrice}</p>
						<p className={`${styles.defaultPrice}`}>{defaultPrice}</p>
					</div>
					<p className={`${styles.itemDescription}`}>{itemDescription}</p>
				</div>
				<div className={`${styles.allergens} ${styles.flexCol}`}>
					<h5>Allergens</h5>
					<p className={`${styles.itemDescription}`}>
						{allergens ? allergens : "n/a"}
					</p>
				</div>
			</div>
			<div className={`${styles.footer} ${styles.flexRow}`}>
				<Button name="edit" onClick={handleClick}>
					Edit
				</Button>
				{!isDefault && (
					<Button name="delete" color="error" onClick={handleClick}>
						Delete
					</Button>
				)}
			</div>
		</div>
	);
}

export default ProductCard;
