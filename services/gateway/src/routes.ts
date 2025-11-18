export const services = [
	{
		route: "/api/auth/login",
		target: "http://localhost:3001/api/auth/login",
		protected: false,
	},
	{
		route: "/api/auth/signup",
		target: "http://localhost:3001/api/auth/signup",
		protected: false,
	},
	{
		route: "/api/gameRoom",
		target: "http://localhost:3002/api/game",
		protected: true,
	},
];
