import React, { useState, useEffect } from "react";
import {
	Button,
	Modal,
	Box,
	Typography,
	CircularProgress,
	Grid,
} from "@mui/material";
import { updateBizDataUser } from "../../../actions/crud/bizUser";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import styles from "../../../styles/components/dashboard/product/product-modal.module.css";
import CurrencyInput from "react-currency-input-field";
import {
	createNewProduct,
	updateProduct,
} from "../../../actions/dashboard/productsCrud";

const modalStyle = {
	overflow: "scroll",
};

function ProductModal({ isOpen, close, bizId, loadProducts, product }) {
	const [style, setStyle] = useState({
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: "max-content",
		bgcolor: "background.paper",
		border: "2px solid #000",
		boxShadow: 24,
		borderRadius: "5px",
		p: 4,
	});
	const [newItemValues, setNewItemValues] = useState({
		itemName: product ? product.itemName : "",
		itemDescription: product
			? product.itemDescription
			: "Let's fight food waste together! Come try our delicious surprise item!",
		originalPrice: product ? product.originalPrice.slice(1) : "",
		defaultPrice: product ? product.defaultPrice.slice(1) : "",
		allergens: product ? product.allergens : "",
		id: product ? product.id : "",
		isDefault: product
			? product.isDefault
				? product.isDefault
				: false
			: false,
		itemImgLink: product
			? product.itemImgLink
				? product.itemImgLink
				: ""
			: "",
		itemLrgImgLink: product
			? product.itemLrgImgLink
				? product.itemLrgImgLink
				: ""
			: "",
	});
	const [handleResponse, setHandleResponse] = useState({
		loading: false,
		errorMessage: "",
		isAlertOpen: false,
	});
	const {
		itemName,
		itemDescription,
		originalPrice,
		defaultPrice,
		allergens,
		isDefault,
		itemImgLink,
		itemLrgImgLink,
	} = newItemValues;
	const { loading, errorMessage, isAlertOpen } = handleResponse;

	useEffect(() => {
		let portrait = window.matchMedia("(orientation: portrait)");

		portrait.addEventListener("change", function (e) {
			if (e.matches) {
				// Portrait mode
				setStyle((prev) => ({ ...prev, top: "50%" }));
			} else {
				// Landscape
				setStyle((prev) => ({ ...prev, top: "100%" }));
			}
		});

		return () => {
			portrait.removeEventListener(
				"change",
				setStyle((prev) => ({ ...prev, top: "50%" }))
			);
		};
	}, []);

	async function handleSubmit(e) {
		e.preventDefault();

		// * Check if price is 20% off original price. defaultPrice should be undefined, return error.

		if (!defaultPrice) {
			setHandleResponse((prev) => ({
				...prev,
				loading: false,
				errorMessage: "List price should be at least 20% off.",
				isAlertOpen: true,
			}));
			return;
		}

		setHandleResponse((prev) => ({ ...prev, loading: true }));

		const isUpdate = product ? true : false;

		const newItemsVal = {
			itemName,
			itemDescription,
			originalPrice: `$${originalPrice}`,
			defaultPrice: `$${defaultPrice}`,
			allergens,
			isDefault,
			itemImgLink,
			itemLrgImgLink,
		};

		// * Edit
		if (isUpdate) {
			const productId = product.id;
			const productUpdateRes = await updateProduct(
				bizId,
				productId,
				newItemsVal
			);
			const { success, message } = productUpdateRes;

			if (success) {
				await loadProducts(bizId);
				setHandleResponse((prev) => ({
					...prev,
					loading: false,
					isAlertOpen: false,
					errorMessage: "",
				}));
				close();
			} else {
				setHandleResponse((prev) => ({
					...prev,
					loading: false,
					errorMessage: message,
					isAlertOpen: true,
				}));
			}
		}

		// * Create new product
		if (!isUpdate) {
			const productRes = await createNewProduct(bizId, newItemsVal);
			const { success, message } = productRes;

			if (success) {
				await loadProducts(bizId);
				setHandleResponse((prev) => ({
					...prev,
					loading: false,
					isAlertOpen: false,
					errorMessage: "",
				}));
				close();
			} else {
				setHandleResponse((prev) => ({
					...prev,
					loading: false,
					errorMessage: message,
					isAlertOpen: true,
				}));
			}
		}
	}

	const handleChange = (e) => {
		const { name, value } = e.target;
		setNewItemValues((prev) => ({ ...prev, [name]: value }));
	};

	const handleCloseModal = () => {
		setHandleResponse((prev) => ({
			loading: false,
			isAlertOpen: false,
			errorMessage: "",
		}));
		setNewItemValues((prev) => ({
			itemName: product ? product.itemName : "",
			itemDescription: product
				? product.itemDescription
				: "Let's fight food waste together! Come try our delicious surprise item!",
			originalPrice: product ? product.originalPrice.slice(1) : "",
			defaultPrice: product ? product.defaultPrice.slice(1) : "",
			allergens: product ? product.allergens : "",
			id: product ? product.id : "",
			isDefault: product
				? product.isDefault
					? product.isDefault
					: false
				: false,
		}));
		close();
	};

	return (
		<React.Fragment>
			<Modal
				open={isOpen}
				// onClose={handleCloseModal}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
				sx={modalStyle}
			>
				<Box sx={style}>
					<div className={`${styles.header} ${styles.flexRow}`}>
						<h2 className={`${styles.title}`}>New Item</h2>
						<Button color="error" onClick={handleCloseModal}>
							Close
						</Button>
					</div>
					<form
						onSubmit={handleSubmit}
						name="form2"
						className={`${styles.form}`}
					>
						<div className={`${styles.itemContainer} ${styles.flexCol}`}>
							{errorMessage && (
								<Collapse in={isAlertOpen}>
									<Alert
										severity="error"
										onClose={() => {
											setHandleResponse((prev) => ({
												...prev,
												isAlertOpen: false,
											}));
										}}
									>
										{errorMessage}
									</Alert>
								</Collapse>
							)}

							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="itemName">* Item name</label>
								<input
									required
									id="itemName"
									name="itemName"
									type="text"
									value={itemName}
									onChange={handleChange}
								/>
							</div>
							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="itemDescription">* Item description</label>
								<textarea
									required
									type="textarea"
									id="itemDescription"
									name="itemDescription"
									value={itemDescription}
									maxLength={350}
									rows="5"
									onChange={handleChange}
									style={{ width: "100%", padding: "5px 0 0 5px" }}
								/>
								<p
									style={{
										textAlign: "right",
										color: "var(--gray)",
									}}
								>
									{itemDescription ? itemDescription.length : 0} / 350
								</p>
							</div>
							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="loginEmail">Allergens</label>
								<textarea
									type="textarea"
									id="allergens"
									name="allergens"
									placeholder="Ex: Nuts, eggs, and cheese."
									value={allergens}
									maxLength={350}
									rows="2"
									onChange={handleChange}
									style={{ width: "100%", padding: "5px 0 0 5px" }}
								/>
							</div>
							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="loginEmail">* Original price</label>
								<CurrencyInput
									id="originalPrice"
									name="originalPrice"
									value={originalPrice}
									prefix="$"
									required
									decimalScale={2}
									decimalsLimit={2}
									onValueChange={(value, name) => {
										setNewItemValues((prev) => ({ ...prev, [name]: value }));
									}}
									style={{
										width: "100%",
										textIndent: "5px",
										height: "40px",
									}}
								/>
							</div>
							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="loginEmail">
									* List price - <i>20% off min.</i>
								</label>
								<CurrencyInput
									id="defaultPrice"
									name="defaultPrice"
									value={defaultPrice}
									prefix="$"
									required
									decimalScale={2}
									decimalsLimit={2}
									onValueChange={(value, name) => {
										const intDefaultPrice = parseFloat(value);
										const intOriginalPrice = parseFloat(originalPrice);
										const twentyOffOriginal = intOriginalPrice * 0.8;

										if (intDefaultPrice > twentyOffOriginal) {
											setHandleResponse((prev) => ({
												...prev,
												loading: false,
												errorMessage: "List price should be at least 20% off.",
												isAlertOpen: true,
											}));
										} else {
											setNewItemValues((prev) => ({ ...prev, [name]: value }));
										}
									}}
									style={{
										width: "100%",
										textIndent: "5px",
										height: "40px",
									}}
								/>
							</div>
							<Button
								type="submit"
								variant="contained"
								sx={{ marginTop: "5px" }}
							>
								{product ? "Save" : "+ Create"}
							</Button>
						</div>
					</form>
				</Box>
			</Modal>
		</React.Fragment>
	);
}

export default ProductModal;
