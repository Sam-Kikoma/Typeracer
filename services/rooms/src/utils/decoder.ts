import type { DecodedToken } from "../types/types.ts";

export const decodeToken = (token: string): DecodedToken | null => {
	try {
		const base64Url = token.split(".")[1];
		if (!base64Url) return null;
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
		return JSON.parse(jsonPayload) as DecodedToken;
	} catch {
		return null;
	}
};
