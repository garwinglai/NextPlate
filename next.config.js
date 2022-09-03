const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	compiler: {
		removeConsole: process.env.NODE_ENV !== "development",
	},
	images: {
		domains: ["img.icons8.com", "media.istockphoto.com"],
		formats: ["image/webp"],
	},
};

const withPWA = require("next-pwa")({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	register: true,
});

module.exports = withPWA(nextConfig);
// module.exports = nextConfig;
