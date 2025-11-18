import express from "express";
import cors from "cors";
import { PORT } from "./utils/config.ts";
import type { Response } from "express";
import morgan from "morgan";
import { services } from "./routes.ts";
import { createProxyMiddleware } from "http-proxy-middleware";
import { protect } from "./middleware/protect.ts";

const app = express();

app.use(cors());
app.use(morgan("combined"));
app.disable("x-powered-by");

app.get("/", (_, res: Response) => {
	res.send("Gateway is live");
});

services.forEach(({ route, target, protected: isProtected }) => {
	const proxyOptions = {
		target,
		changeOrigin: true,
		onProxyReq: (proxyReq: any, req: any) => {
			if (req.headers.authorization) {
				proxyReq.setHeader("Authorization", req.headers.authorization);
			}
		},
	};

	if (isProtected) {
		app.use(route, protect, createProxyMiddleware(proxyOptions));
	} else {
		app.use(route, createProxyMiddleware(proxyOptions));
	}
});

app.listen(PORT, () => {
	console.log(`Gateway is running on ${PORT}`);
});
