import fetch from "isomorphic-fetch";

async function createStripeAccount(email) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const createAccountEndPoint = "createBizAccountNP";
	const testCreateAccountEndPoint = "testCreateBizAccountNP";
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
	const retrieveStripeEndPoint = "retrieveAccountNP";
	const testRetrieveStripeEndPoint = "testRetrieveAccountNP";
	const data = { account: stripeAccId };

	console.log("data", data);
	// * Fetch Stripe Account
	baseUrl = baseUrl.concat(retrieveStripeEndPoint);

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
		// console.log("resText", resText);
		const status = res.status;
		const detailsSubmitted = resJson.details_submitted;
		const requirementErrorsArr = resJson.requirements.errors;

		if (status === 200) {
			console.log(status);
			return { success: true, detailsSubmitted, requirementErrorsArr };
		} else {
			return { success: false, message: "Unable to get Stripe account." };
		}
	} catch (error) {
		// console.log(error);
		console.log("stripe", error);
		return { success: false, message: `${error}` };
	}
}

async function connectStripeAccount(stripeAccId, refreshUrl, returnUrl) {
	let baseUrl = "https://restoq.herokuapp.com/";
	const onboardStripeEndPoint = "accountOnboardingNP";
	const testOnboardStripeEndPoint = "testAccountOnboardingNP";
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
		console.log("status connect stripe acc", res);

		if (status === 200) {
			return { success: true, url };
		} else {
			return { success: false, message: "Unable to get Stripe account." };
		}
	} catch (error) {
		console.log("error trycatch connect stripe", error);
		return { success: false, message: `${error}` };
	}
}

const payoutStripe = async (amount, account) => {
	let baseUrl = "https://restoq.herokuapp.com/";
	// TODO: make sure this endpoint is correct
	const transferPayoutEndPoint = "transferPayoutNP";
	const testTransferPayoutNP = "testTransferPayoutNP";
	const data = {
		amount,
		account,
	};

	console.log("data", data);
	// * Payout Stripe Accounts
	baseUrl = baseUrl.concat(transferPayoutEndPoint);

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
		const status = res.status;
		const resJson = JSON.parse(resText);
		// console.log("resJson", resJson);
		// console.log("res", res);
		// console.log("status", status);

		if (status === 200) {
			return { success: true };
		} else {
			console.log("error 500 status: bank account not setup", status);
			return {
				success: false,
				message:
					"Unable to payout business. Error 500. {No account or no balance}",
			};
		}
	} catch (error) {
		console.log("Error posting to stripe/heroku:", error);
		return {
			success: false,
			message: `Error posting to stripe/heroku: ${error}`,
		};
	}
};

export default createStripeAccount;
export { fetchStripeAccount, connectStripeAccount, payoutStripe };
