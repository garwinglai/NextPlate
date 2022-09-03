const playNotificationSound = (audio, action) => {
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
};

const isSoundEnabled = async (audio, action) => {
	let hasSound = false;

	if (action === "start") {
		audio.muted = true;
		await audio
			.play()
			.then(() => {
				hasSound = true;
			})
			.catch((e) => {
				hasSound = false;
			});
		return hasSound;
	}
};

export default playNotificationSound;
export { isSoundEnabled };
