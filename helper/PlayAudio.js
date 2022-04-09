function playNotificationSound(audio, action) {
	if (!audio) {
		return;
	}
	if (action === "start") {
		audio.play();
		audio.loop = true;
	}

	if (action === "end") {
		audio.pause();
		audio.currentTime = 0;
	}
}

export default playNotificationSound;
