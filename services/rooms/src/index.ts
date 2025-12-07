import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PORT } from "./utils/config.ts";
import { decodeToken } from "./utils/decoder.ts";
import type { DecodedToken, SocketUser } from "./types/types.ts";
import * as RoomStore from "../src/store/room.ts";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {});

io.use((socket, next) => {
	try {
		const authToken =
			socket.handshake.auth?.token ||
			(socket.handshake.headers && (socket.handshake.headers.authorization as string | undefined)?.split(" ")[1]) ||
			undefined;

		if (!authToken) {
			return next(new Error("Authentication token missing"));
		}

		const decoded = decodeToken(authToken) as DecodedToken | null;
		if (!decoded) return next(new Error("Invalid token"));

		socket.data.user = decoded as SocketUser;

		return next();
	} catch (err) {
		return next(new Error("Auth error"));
	}
});

const broadcastRoomState = (roomId: string) => {
	const room = RoomStore.getRoom(roomId);
	if (!room) return;
	const payload = {
		id: room.id,
		status: room.status,
		players: Array.from(room.players.values()).map((p) => ({
			userId: p.userId,
			username: p.username,
			socketId: p.socketId,
		})),
		maxPlayers: room.maxPlayers,
	};
	io.to(roomId).emit("room_state", payload);
};

//Call gameEngine
function notifyGameEngineStart(roomId: string, players: Array<{ userId: number; username: string }>) {
	console.log("NOTIFY GAME ENGINE START", roomId, players);
}

io.on("connection", (socket: Socket) => {
	const user = socket.data.user as SocketUser;
	console.log(`socket connected: ${socket.id} user: ${user.username}`);

	socket.on("create_room", (opts: { maxPlayers?: number } = {}, cb?: (err: string | null, room?: any) => void) => {
		try {
			const maxPlayers = opts.maxPlayers ?? 8;
			const room = RoomStore.createRoom(socket.id, user.id, user.username, maxPlayers);
			socket.join(room.id);
			broadcastRoomState(room.id);
			cb && cb(null, { roomId: room.id });
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	socket.on("join_room", (data: { roomId: string }, cb?: (err: string | null, room?: any) => void) => {
		try {
			const room = RoomStore.getRoom(data.roomId);

			if (!room) return cb && cb("room_not_found");
			if (room.players.size >= room.maxPlayers) return cb && cb("room_full");

			RoomStore.joinRoom(room.id, socket.id, user.id, user.username);
			socket.join(room.id);

			io.to(room.id).emit("player_joined", { userId: user.id, username: user.username, socketId: socket.id });
			broadcastRoomState(room.id);

			cb && cb(null, { roomId: room.id });
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	socket.on("leave_room", (data: { roomId: string }, cb?: (err?: string) => void) => {
		try {
			const room = RoomStore.leaveRoom(data.roomId, socket.id);
			socket.leave(data.roomId);
			if (room) {
				io.to(data.roomId).emit("player_left", { userId: user.id, username: user.username, socketId: socket.id });
				broadcastRoomState(data.roomId);
			}
			cb && cb();
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	socket.on("start_race", (data: { roomId: string; countdownSeconds?: number }, cb?: (err?: string) => void) => {
		try {
			const room = RoomStore.getRoom(data.roomId);
			if (!room) return cb && cb("room_not_found");
			if (room.hostUserId !== user.id) return cb && cb("only_host_can_start");
			if (room.status !== "waiting") return cb && cb("invalid_room_state");

			const countdownSeconds = data.countdownSeconds ?? 3;

			RoomStore.setRoomStatus(room.id, "countdown");
			io.to(room.id).emit("countdown_start", { seconds: countdownSeconds });

			let sec = countdownSeconds;
			const interval = setInterval(() => {
				sec -= 1;
				if (sec > 0) {
					io.to(room.id).emit("countdown_tick", { secondsLeft: sec });
				} else {
					clearInterval(interval);
					RoomStore.setRoomStatus(room.id, "in-progress");
					io.to(room.id).emit("race_start", { startedAt: Date.now() });
					const players = Array.from(room.players.values()).map((p) => ({ userId: p.userId, username: p.username }));
					notifyGameEngineStart(room.id, players);
					broadcastRoomState(room.id);
				}
			}, 1000);

			cb && cb();
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	socket.on("disconnect", (reason) => {
		console.log(`socket disconnected: ${socket.id} reason: ${reason}`);
		for (const roomMeta of RoomStore.listRooms()) {
			const room = RoomStore.getRoom(roomMeta.id);
			if (!room) continue;
			if (room.players.has(socket.id)) {
				RoomStore.leaveRoom(room.id, socket.id);
				io.to(room.id).emit("player_left", { userId: user.id, username: user.username, socketId: socket.id });
				broadcastRoomState(room.id);
			}
		}
	});

	socket.on("get_room_state", (data: { roomId: string }, cb?: (err: string | null, state?: any) => void) => {
		const room = RoomStore.getRoom(data.roomId);
		if (!room) return cb && cb("room_not_found");
		cb &&
			cb(null, {
				id: room.id,
				status: room.status,
				players: Array.from(room.players.values()).map((p) => ({ userId: p.userId, username: p.username })),
				maxPlayers: room.maxPlayers,
			});
	});
});

app.get("/rooms", (req, res) => {
	res.json(RoomStore.listRooms());
});

server.listen(PORT);
