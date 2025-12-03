import type { Request, Response } from "express";
import { decodeToken } from "../utils/tokenDecoder.ts";
import prisma from "../utils/db.ts";

export const getRooms = async (req: Request, res: Response) => {
	try {
		const rooms = await prisma.room.findMany({
			where: {
				status: "WAITING",
			},
			include: {
				players: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		console.log("Rooms found:", rooms.length);

		const roomList = rooms.map((room) => ({
			id: room.id,
			code: room.code,
			hostId: room.hostId,
			status: room.status,
			maxPlayers: room.maxPlayers,
			playerCount: room.players.length,
			isFull: room.players.length >= room.maxPlayers,
		}));

		return res.status(200).json({
			success: true,
			rooms: roomList,
		});
	} catch (error) {
		console.error("Error in getRooms:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to fetch rooms",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

export const newRoom = async (req: Request, res: Response) => {
	try {
		console.log("newRoom called");

		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authHeader.split(" ")[1];
		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decoded = decodeToken(token);
		if (!decoded || !decoded.id) {
			return res.status(401).json({ error: "Invalid token" });
		}

		const newRoom = await prisma.room.create({
			data: {
				hostId: decoded.id,
			},
		});

		return res.status(201).json({
			success: true,
			room: newRoom,
		});
	} catch (error) {
		console.error("Error in newRoom:", error);
		return res.status(500).json({ error: "Failed to create room" });
	}
};

export const joinRoom = async (req: Request, res: Response) => {
	try {
		console.log("joinRoom called");

		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authHeader.split(" ")[1];
		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decoded = decodeToken(token);
		if (!decoded || !decoded.id) {
			return res.status(401).json({ error: "Invalid token" });
		}

		const { roomCode } = req.params;
		if (!roomCode) {
			return res.status(400).json({ error: "Room code is required" });
		}

		const room = await prisma.room.findUnique({
			where: { code: roomCode },
			include: { players: true },
		});

		if (!room) {
			return res.status(404).json({ error: "Room not found" });
		}

		const player = await prisma.player.create({
			data: {
				userId: decoded.id,
				roomId: room.id,
			},
		});

		return res.status(200).json({
			success: true,
			player,
		});
	} catch (error) {
		console.error("Error in joinRoom:", error);
		return res.status(500).json({ error: "Failed to join room" });
	}
};

export const leaveRoom = async (req: Request, res: Response) => {
	try {
		console.log("leaveRoom called");

		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authHeader.split(" ")[1];
		if (!token) {
			return res.status(401).json({ error: "Invalid token format" });
		}

		const decoded = decodeToken(token);
		if (!decoded || !decoded.id) {
			return res.status(401).json({ error: "Invalid token" });
		}

		const { roomId } = req.params;
		if (!roomId) {
			return res.status(400).json({ error: "Room ID is required" });
		}

		await prisma.player.deleteMany({
			where: {
				userId: decoded.id,
				roomId: parseInt(roomId),
			},
		});

		return res.status(200).json({
			success: true,
			message: "Left room successfully",
		});
	} catch (error) {
		console.error("Error in leaveRoom:", error);
		return res.status(500).json({ error: "Failed to leave room" });
	}
};
