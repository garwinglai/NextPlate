const { https, pubsub } = require("firebase-functions");
const { default: next } = require("next");
import runBizPayouts from "./helper/CalculatePayout";

const isDev = process.env.NODE_ENV !== "production";

const server = next({
	dev: isDev,
	//location of .next generated after running -> yarn build
	conf: { distDir: ".next" },
});

const nextjsHandle = server.getRequestHandler();
exports.nextServer = https.onRequest((req, res) => {
	return server.prepare().then(() => nextjsHandle(req, res));
});

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

// BizIds with no commission until Sept 1st
// L27Fa9DmUzXmpLJr5BFz: Funculo
// mMVqwtl3jmPm3vU2SuMG: Knead Noods Pasta Bar
// PkSfV8QqS3frbO4kK5aZ: Civilization
