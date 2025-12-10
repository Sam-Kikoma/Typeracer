import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.typeracer.app",
	appName: "Typeracer",
	webDir: "dist",
	android: {
		// Use HTTP instead of HTTPS to allow mixed content requests to local dev server
		allowMixedContent: true,
	},
	server: {
		// Allow cleartext (HTTP) traffic
		cleartext: true,
		// Use HTTP scheme instead of HTTPS
		androidScheme: "http",
	},
};

export default config;
