import type { Room, Player } from "../types/types.ts";
import { v4 as uuid4 } from "uuid";

const rooms = new Map<string, Room>();

export const createRoom = (hostSocketId: string, hostUserId: number, hostUsername: string, maxPlayers = 2): Room => {
	const id = uuid4();
	const players = new Map<string, Player>();
	players.set(hostSocketId, {
		socketId: hostSocketId,
		userId: hostUserId,
		username: hostUsername,
		joinedAt: Date.now(),
	});
	const room: Room = {
		id,
		hostUserId,
		hostSocketId,
		players,
		maxPlayers,
		status: "waiting",
		createdAt: Date.now(),
	};

	rooms.set(id, room);
	return room;
};

export const getRoom = (roomId: string): Room | undefined => {
	return rooms.get(roomId);
};

export const joinRoom = (roomId: string, socketId: string, userId: number, username: string): Room | undefined => {
	const room = rooms.get(roomId);
	if (!room) return undefined;
	if (room.players.size >= room.maxPlayers) return undefined;
	room.players.set(socketId, {
		socketId,
		userId,
		username,
		joinedAt: Date.now(),
	});
	return room;
};

export const leaveRoom = (roomId: string, socketId: string): Room | undefined => {
	const room = rooms.get(roomId);
	if (!room) return undefined;
	room.players.delete(socketId);
	if (room.players.size === 0) {
		rooms.delete(roomId);
		return undefined;
	}
	if (room.hostSocketId === socketId) {
		const first = room.players.values().next();
		if (!first.done) {
			room.hostSocketId = first.value.socketId;
			room.hostUserId = first.value.userId;
		}
	}
	return room;
};

export const setRoomStatus = (roomId: string, status: Room["status"]): Room | undefined => {
	const room = rooms.get(roomId);
	if (!room) return undefined;
	room.status = status;
	return room;
};

export const listRooms = () => {
	return Array.from(rooms.values()).map((r) => ({
		id: r.id,
		players: r.players.size,
		maxPlayers: r.maxPlayers,
		status: r.status,
	}));
};
