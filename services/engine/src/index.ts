import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PORT } from "./utils/config.ts";
import * as GameStore from "./store/game.ts";

const app = express();
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	})
);
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

// Broadcast race state to all players in a room
const broadcastRaceState = (roomId: string) => {
	const session = GameStore.getRaceSession(roomId);
	if (!session) return;

	const players = Array.from(session.players.values()).map((p) => ({
		userId: p.userId,
		username: p.username,
		progress: p.progress,
		wpm: p.wpm,
		accuracy: p.accuracy,
		finished: p.finished,
	}));

	io.to(roomId).emit("race_state", {
		roomId: session.roomId,
		status: session.status,
		players,
	});
};

io.on("connection", (socket: Socket) => {
	console.log(`Engine socket connected: ${socket.id}`);

	// Start a new race session
	socket.on(
		"start_race",
		(
			data: { roomId: string; players: Array<{ userId: number; username: string }> },
			cb?: (err: string | null, session?: any) => void
		) => {
			try {
				const session = GameStore.createRaceSession(data.roomId, data.players);
				socket.join(data.roomId);

				// Notify all players in the room about the race text
				io.to(data.roomId).emit("race_started", {
					roomId: session.roomId,
					text: session.text,
					startedAt: session.startedAt,
				});

				cb && cb(null, { roomId: session.roomId, text: session.text });
			} catch (err) {
				console.error(err);
				cb && cb("failed");
			}
		}
	);

	// Join existing race session
	socket.on("join_race", (data: { roomId: string }, cb?: (err: string | null, session?: any) => void) => {
		try {
			const session = GameStore.getRaceSession(data.roomId);
			if (!session) return cb && cb("race_not_found");

			socket.join(data.roomId);

			cb &&
				cb(null, {
					roomId: session.roomId,
					text: session.text,
					startedAt: session.startedAt,
				});
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	// Update player progress
	socket.on(
		"update_progress",
		(
			data: { roomId: string; userId: number; progress: number; wpm: number; accuracy: number },
			cb?: (err?: string) => void
		) => {
			try {
				const session = GameStore.updatePlayerProgress(
					data.roomId,
					data.userId,
					data.progress,
					data.wpm,
					data.accuracy
				);

				if (!session) return cb && cb("session_not_found");

				// Broadcast updated progress to all players
				broadcastRaceState(data.roomId);

				// Check if player just finished
				const player = session.players.get(data.userId);
				if (player && player.finished && player.finishedAt) {
					io.to(data.roomId).emit("player_finished", {
						userId: player.userId,
						username: player.username,
						wpm: player.wpm,
						accuracy: player.accuracy,
						finishedAt: player.finishedAt,
					});
				}

				// Check if race is finished
				const raceFinished = GameStore.checkRaceFinished(data.roomId);
				if (raceFinished) {
					const results = GameStore.getRaceResults(data.roomId);
					io.to(data.roomId).emit("race_finished", {
						results,
					});
				}

				cb && cb();
			} catch (err) {
				console.error(err);
				cb && cb("failed");
			}
		}
	);

	// Get current race state
	socket.on("get_race_state", (data: { roomId: string }, cb?: (err: string | null, state?: any) => void) => {
		try {
			const session = GameStore.getRaceSession(data.roomId);
			if (!session) return cb && cb("race_not_found");

			const players = Array.from(session.players.values()).map((p) => ({
				userId: p.userId,
				username: p.username,
				progress: p.progress,
				wpm: p.wpm,
				accuracy: p.accuracy,
				finished: p.finished,
			}));

			cb &&
				cb(null, {
					roomId: session.roomId,
					text: session.text,
					status: session.status,
					startedAt: session.startedAt,
					players,
				});
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	// Get race results
	socket.on("get_results", (data: { roomId: string }, cb?: (err: string | null, results?: any) => void) => {
		try {
			const results = GameStore.getRaceResults(data.roomId);
			if (!results) return cb && cb("race_not_found");

			cb && cb(null, results);
		} catch (err) {
			console.error(err);
			cb && cb("failed");
		}
	});

	socket.on("disconnect", (reason) => {
		console.log(`Engine socket disconnected: ${socket.id} reason: ${reason}`);
	});
});

server.listen(PORT, () => {
	console.log(`=== Game Engine Service ===`);
	console.log(`WebSocket: ws://localhost:${PORT}`);
});
