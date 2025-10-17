import express from "express";
import type { Request, Response } from "express";
import userRouter from "./routes/user.ts";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/auth", (req: Request, res: Response) => {
	res.send("<p>Auth service is live</p>");
});

app.use("/api/auth", userRouter);

export default app;
