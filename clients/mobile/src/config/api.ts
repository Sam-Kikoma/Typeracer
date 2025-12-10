export const API_CONFIG = {
	GAME_SERVER: import.meta.env.VITE_GAME_SERVER || "http://localhost:3002",
	ENGINE_SERVER: import.meta.env.VITE_ENGINE_SERVER || "http://localhost:3003",
	AUTH_API: import.meta.env.VITE_AUTH_API || "http://localhost:8080/api/auth",
};

// Debug logging
console.log("API_CONFIG:", API_CONFIG);
