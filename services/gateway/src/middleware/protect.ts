import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/config.ts";

export const protect = (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authHeader.split(" ")[1];
		if (!token || !JWT_SECRET) {
			return res.status(401).json({ error: "No token or secret configured" });
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		(req as any).user = decoded;

		next();
	} catch (error) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};
