export interface DecodedToken {
	id: number;
	username: string;
}

export type SocketUser = DecodedToken;

export type RoomStatus = "waiting" | "countdown" | "in-progress" | "finished";

export interface Player {
	socketId: string;
	userId: number;
	username: string;
	joinedAt: number;
}

export interface Room {
	id: string;
	hostUserId: number;
	hostSocketId: string;
	players: Map<string, Player>; // key = socketId
	maxPlayers: number;
	status: RoomStatus;
	createdAt: number;
}
