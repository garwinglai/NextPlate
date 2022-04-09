import React, { useState } from "react";
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

const style = {
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
};

function ProductModal({ isOpen, close, bizId, loadProducts, product }) {
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
	} = newItemValues;
	const { loading, errorMessage, isAlertOpen } = handleResponse;

	async function handleSubmit(e) {
		e.preventDefault();
		setHandleResponse((prev) => ({ ...prev, loading: true }));

		const isUpdate = product ? true : false;

		const newItemsVal = {
			itemName,
			itemDescription,
			originalPrice: `$${originalPrice}`,
			defaultPrice: `$${defaultPrice}`,
			allergens,
			isDefault,
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

	function handleChange(e) {
		const { name, value } = e.target;
		// console.log(name, value);
		if (name === "originalPrice" || name === "defaultPrice") {
			setNewItemValues((prev) => ({ ...prev, [name]: value }));
		} else {
			setNewItemValues((prev) => ({ ...prev, [name]: value }));
		}
	}

	function handleCheckedPrice(price) {
		if (price === defaultPrice) {
			return true;
		}

		return false;
	}

	// console.log("product", product);
	// console.log("defaultPrice", defaultPrice);

	return (
		<React.Fragment>
			<Modal
				open={isOpen}
				onClose={close}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<div className={`${styles.header} ${styles.flexRow}`}>
						<h2 className={`${styles.title}`}>New Item</h2>
						<Button color="error" onClick={close}>
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
								<Grid item xs={12} md={6} mt={2} sx={{ width: "50px" }}>
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
											<AlertTitle>Error</AlertTitle>
											{errorMessage}
										</Alert>
									</Collapse>
								</Grid>
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
									onValueChange={(value, name) =>
										setNewItemValues((prev) => ({ ...prev, [name]: value }))
									}
									style={{
										width: "100%",
										textIndent: "5px",
										height: "40px",
									}}
								/>
							</div>
							<div className={`${styles.itemGroup} ${styles.flexCol}`}>
								<label htmlFor="loginEmail">* List price</label>
								<div className={`${styles.listPriceRadioGroup}`}>
									<div className={`${styles.priceGroup}`}>
										<input
											className={`${styles.radios}`}
											id="three"
											checked={handleCheckedPrice("3.99")}
											type="radio"
											name="defaultPrice"
											value="3.99"
											onChange={handleChange}
										/>
										<label
											htmlFor="three"
											className={`${styles.labels} ${
												defaultPrice === "3.99"
													? styles.labelsChecked
													: undefined
											}`}
										>
											$3.99
										</label>
									</div>
									<div className={`${styles.priceGroup}`}>
										<input
											className={`${styles.radios}`}
											id="four"
											checked={handleCheckedPrice("4.99")}
											type="radio"
											name="defaultPrice"
											value="4.99"
											onChange={handleChange}
										/>
										<label
											htmlFor="four"
											className={`${styles.labels} ${
												defaultPrice === "4.99"
													? styles.labelsChecked
													: undefined
											}`}
										>
											$4.99
										</label>
									</div>
									<div className={`${styles.priceGroup}`}>
										<input
											className={`${styles.radios}`}
											id="five"
											checked={handleCheckedPrice("5.99")}
											type="radio"
											name="defaultPrice"
											value="5.99"
											onChange={handleChange}
										/>
										<label
											htmlFor="five"
											className={`${styles.labels} ${
												defaultPrice === "5.99"
													? styles.labelsChecked
													: undefined
											}`}
										>
											$5.99
										</label>
									</div>
								</div>
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
