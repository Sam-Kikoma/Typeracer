import type { Request, Response } from "express";
import prisma from "../utils/db.ts";
import { comparePassword, hashPassword, jwtGen } from "../utils/auth.ts";

export const newUser = async (req: Request, res: Response) => {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ error: "Username & Password are required" });
		}
		const user = await prisma.user.create({
			data: {
				username: username,
				password: await hashPassword(password),
			},
		});
		const token = jwtGen({ id: user.id, username: user.username });
		res.json({ token });
	} catch (error: any) {
		console.error("User creation error:", error);
		if (error.code === "P2002") {
			return res.status(409).json({ error: "Username already exists" });
		}
		return res.status(500).json({
			error: "Failed to create user",
		});
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const user = await prisma.user.findUnique({
			where: {
				username: req.body.username,
			},
		});

		if (!user) {
			return res.status(401).json({
				error: "Invalid username or password",
			});
		}

		const isValid = await comparePassword(req.body.password, user.password);
		if (!isValid) {
			return res.status(401).json({
				error: "Invalid username or password",
			});
		}
		const token = jwtGen({ id: user.id, username: user.username });
		res.json({ token });
	} catch (error: any) {
		console.error("Failed to login");
		return res.status(500).json({
			error: "Failed to login",
		});
	}
};
