import fetch from "isomorphic-fetch";

async function createStripeAccount(email) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const createAccountEndPoint = "createBizAccountNP";
	const data = { email };

	// * Create Stripe Account
	baseUrl = baseUrl.concat(createAccountEndPoint);

	try {
		const res = await fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const resText = await res.text();
		const resJson = JSON.parse(resText);
		const accountId = resJson.id;
		const status = res.status;

		if (status === 200) {
			return { success: true, accountId };
		} else {
			return { success: false, message: "Unable to create stripe account." };
		}
	} catch (error) {
		return { success: false, message: `${error}` };
	}
}

async function fetchStripeAccount(stripeAccId) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const fetchStripeEndPoint = "retrieveAccountNP";
	const data = { account: stripeAccId };

	// * Fetch Stripe Account
	baseUrl = baseUrl.concat(fetchStripeEndPoint);

	try {
		const res = await fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const resText = await res.text();
		const resJson = JSON.parse(resText);
		const status = res.status;
		const detailsSubmitted = resJson.details_submitted;
		const requirementErrorsArr = resJson.requirements.errors;

		if (status === 200) {
			return { success: true, detailsSubmitted, requirementErrorsArr };
		} else {
			return { success: false, message: "Unable to get Stripe account." };
		}
	} catch (error) {
		console.log(error);
		return { success: false, message: `${error}` };
	}
}

async function connectStripeAccount(stripeAccId, refreshUrl, returnUrl) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const onboardStripeEndPoint = "accountOnboardingNP";
	const data = {
		account: stripeAccId,
		refresh_url: refreshUrl,
		return_url: returnUrl,
	};

	// * Fetch Stripe Account
	baseUrl = baseUrl.concat(onboardStripeEndPoint);

	try {
		const res = await fetch(baseUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		const resText = await res.text();
		const resJson = JSON.parse(resText);
		const { created, expires_at, object, url } = resJson;
		const status = res.status;

		if (status === 200) {
			return { success: true, url };
		} else {
			return { success: false, message: "Unable to get Stripe account." };
		}
	} catch (error) {
		console.log("error", error);
		return { success: false, message: `${error}` };
	}
}

export default createStripeAccount;
export { fetchStripeAccount, connectStripeAccount };
