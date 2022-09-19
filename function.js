const { https, pubsub } = require("firebase-functions");
const { default: next } = require("next");
// const { sendNotifAutomated } = require("./actions/heroku/notifications");
// const runBizPayouts = require("./helper/CalculatePayout");

const isDev = process.env.NODE_ENV !== "production";

const server = next({
	dev: isDev,
	//location of .next generated after running -> yarn build
	conf: { distDir: ".next" },
});

// Connect server to nextJs
const nextjsHandle = server.getRequestHandler();

exports.nextServer = https.onRequest((req, res) => {
	return server.prepare().then(() => nextjsHandle(req, res));
});

// exports.scheduleNotif = pubsub.schedule("0 11 * * 1,4").onRun((ctx) => {
// 	logger.info("Runs 11am every Mon & Thurs", ctx);

// 	sendNotifAutomated();

// 	return null;
// });

// Payout 1AM Every Monday
// exports.scheduleWeeklyPayout = pubsub
// 	.schedule("0 1 * * MON")
// 	.onRun((context) => {
// 		logger.info("Runs 1AM Every Monday", context);

// 		const {success, message} = await runBizPayouts();

// 		if(success){
// 			logger.info("successfully paid")
// 		} else {
// 			logger.info(`Error paying: ${message}`)
// 		}

// 		return null;
// 	});
