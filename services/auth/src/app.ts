import express from "express";
import type { Request, Response } from "express";
import userRouter from "./routes/user.ts";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
	res.send("<p>Auth service is live</p>");
});

app.use("/api/users", userRouter);

export default app;
