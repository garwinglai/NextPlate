import React, { useEffect } from "react";
import { useRouter } from "next/router";

// * Redirect to app landing page on Wix.
function AppLandingPage() {
	const router = useRouter();

	useEffect(() => {
		redirectAppDownload(router);
	}, [router]);

	return <div style={{ display: "none" }}>app</div>;
}

export default AppLandingPage;

const redirectAppDownload = (router) => {
	const opSystem = checkScreenSize();

	if (opSystem == "iOS") {
		router.push("https://apps.apple.com/us/app/nextplate/id1608079261");
	} else if (opSystem == "Android") {
		router.push(
			"https://play.google.com/store/apps/details?id=co.sponty.ness.nextplate&hl=en_US&gl=US"
		);
	} else {
		console.log("not iOS or Android");
		router.push("https://www.home.nextplate.app/app-landing-page");
	}
};

const checkScreenSize = () => {
	if (window.innerWidth <= 760) {
		const opSystem = getMobileOperatingSystem();

		return opSystem;
	} else {
		return "Desktop";
	}
};

const getMobileOperatingSystem = () => {
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;

	// Windows Phone must come first because its UA also contains "Android"
	if (/windows phone/i.test(userAgent)) {
		return "Windows Phone";
	}

	if (/android/i.test(userAgent)) {
		return "Android";
	}

	// iOS detection from: http://stackoverflow.com/a/9039885/177710
	if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
		return "iOS";
	}

	return "unknown";
};

// function checkScreenSize() {
// 	if ($(window).width() <= 760) {
// 			// Firefox 1.0+
// 			var isFirefox = typeof InstallTrigger !== 'undefined';
// ​
// 			// Safari 3.0+ "[object HTMLElementConstructor]"
// 			var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));
// ​
// 			// Chrome 1 - 79
// 			var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
// ​
// 			var browser = "";
// 			if (isFirefox) {
// 					browser = "Firefox"
// 			} else if (isSafari) {
// 					browser = "Safari"
// 			} else {
// 					browser = "Chrome"
// 			}

// 			var opSystem = getMobileOperatingSystem();

// 			if (opSystem == "iOS") {
// 					window.open("https://apps.apple.com/us/app/nextplate/id1608079261");
// 			} else if (opSystem == "Android") {
// 					window.open("https://play.google.com/store/apps/details?id=co.sponty.ness.nextplate&hl=en_US&gl=US");
// 			}
// 	} else {
// 			document.getElementById("mobile-mystery").style.display = 'none'
// 			document.getElementById("mobile-affiliate").style.display = 'none'
// 	}
// }
// ​
// function getMobileOperatingSystem() {
// var userAgent = navigator.userAgent || navigator.vendor || window.opera;
// ​
// 		// Windows Phone must come first because its UA also contains "Android"
// 	if (/windows phone/i.test(userAgent)) {
// 			return "Windows Phone";
// 	}
// ​
// 	if (/android/i.test(userAgent)) {
// 			return "Android";
// 	}
// ​
// 	// iOS detection from: http://stackoverflow.com/a/9039885/177710
// 	if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
// 			return "iOS";
// 	}
// ​
// 	return "unknown";
// }
