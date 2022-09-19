import React from "react";
import { sendNotifAutomated } from "../../actions/heroku/notifications";
import Layout from "../../Components/Layout";

// TODO: account for yesterdays schedule and not todays to send notif
// * Gar's Id: jwjpNFZYY2aplvkhVdiaPMrM7mL2

function notifications() {
	const handleSendRecurNotif = async () => {
		console.log("clicked")
		sendNotifAutomated();
	};

	return (
		<Layout currentPage="admin">
			<button onClick={handleSendRecurNotif}>send recur notifications</button>
		</Layout>
	);
}

export default notifications;
