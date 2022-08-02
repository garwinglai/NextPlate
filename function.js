const { https, pubsub } = require("firebase-functions");
const { default: next } = require("next");

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

// exports.scheduledNotification = pubsub
// 	.schedule("every 5 minutes")
// 	.onRun((context) => {
// 		console.log("will run each 5 minutes", context);
// 		return null;
// 	});
