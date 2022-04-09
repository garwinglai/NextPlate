import fetch from "isomorphic-fetch";

async function chargePayment(getStatus, chargeId, payMethod) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const capturePaymentVisa = "capturePaymentNP";
	const refundPayment = "refundNP";
	const captureApplePaymentNP = "captureApplePaymentNP";

	// * Free orders
	if (chargeId === "noId") {
		return { success: true };
	}

	// * Charge Stripe
	if (getStatus === "Confirmed") {
		if (payMethod === "Apple Pay") {
			baseUrl = baseUrl.concat(captureApplePaymentNP);
		} else {
			baseUrl = baseUrl.concat(capturePaymentVisa);
		}
		const data = { chargeId };

		return fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		})
			.then((data) => {
				const status = data.status;

				if (status === 200) {
					return { success: true, status };
				} else {
					return { success: false, status };
				}
			})
			.catch((error) => {
				return { success: false, error };
			});
	}

	// * Refund Stripe
	if (getStatus === "Canceled") {
		baseUrl = baseUrl.concat(refundPayment);
		const data = { chargeId };

		return fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		})
			.then((data) => {
				const status = data.status;

				if (status === 200) {
					return { success: true, status };
				} else {
					return { success: false, status };
				}
			})
			.catch((error) => {
				return { success: false, error };
			});
	}
}

export default chargePayment;
