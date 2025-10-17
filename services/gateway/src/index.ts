import express from "express";
import { PORT } from "./utils/config.ts";
import type { Response } from "express";

const app = express();

app.get("/", (_, res: Response) => {
	res.send("Gateway is live");
});

app.listen(PORT, () => {
	console.log(`Gateay is running on ${PORT}`);
});
