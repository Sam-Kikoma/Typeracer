import axios from "axios";

const API_URL = "http://localhost:8080/api/auth";

interface AuthCredentials {
	username: string;
	password: string;
}

interface AuthResponse {
	token: string;
}

interface DecodedToken {
	id: number;
	username: string;
	exp: number;
}

const decodeToken = (token: string): DecodedToken | null => {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
};

export const loginReq = async (
	credentials: AuthCredentials
): Promise<{ token: string; user: { id: number; username: string } }> => {
	const response = await axios.post<AuthResponse>(`${API_URL}/login`, credentials);
	const decoded = decodeToken(response.data.token);

	if (!decoded) {
		throw new Error("Invalid token received");
	}

	return {
		token: response.data.token,
		user: { id: decoded.id, username: decoded.username },
	};
};

export const signupReq = async (
	credentials: AuthCredentials
): Promise<{ token: string; user: { id: number; username: string } }> => {
	const response = await axios.post<AuthResponse>(`${API_URL}/signup`, credentials);
	const decoded = decodeToken(response.data.token);

	if (!decoded) {
		throw new Error("Invalid token received");
	}

	return {
		token: response.data.token,
		user: { id: decoded.id, username: decoded.username },
	};
};

export const getToken = (): string | null => {
	return localStorage.getItem("token");
};
