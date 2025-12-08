import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import AuthContext from "./AuthContext";

interface Player {
	userId: number;
	username: string;
	socketId: string;
}

interface RoomState {
	id: string;
	status: "waiting" | "countdown" | "in-progress" | "finished";
	players: Player[];
	maxPlayers: number;
}

interface RoomListItem {
	id: string;
	playerCount: number;
	maxPlayers: number;
	status: "waiting" | "countdown" | "in-progress" | "finished";
}

interface RacePlayer {
	userId: number;
	username: string;
	progress: number;
	wpm: number;
	accuracy: number;
	finished: boolean;
}

interface RaceResult {
	userId: number;
	username: string;
	wpm: number;
	accuracy: number;
	position: number;
	finished: boolean;
}

interface GameContextType {
	socket: Socket | null;
	engineSocket: Socket | null;
	isConnected: boolean;
	isEngineConnected: boolean;
	currentRoom: RoomState | null;
	availableRooms: RoomListItem[];
	countdownSeconds: number | null;
	raceStarted: boolean;
	raceText: string | null;
	racePlayers: RacePlayer[];
	raceResults: RaceResult[] | null;
	getRooms: () => void;
	createRoom: (maxPlayers?: number) => Promise<{ roomId: string }>;
	joinRoom: (roomId: string) => Promise<void>;
	leaveRoom: (roomId: string) => Promise<void>;
	startRace: (roomId: string) => Promise<void>;
	updateProgress: (roomId: string, userId: number, progress: number, wpm: number, accuracy: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
	const authContext = useContext(AuthContext);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [engineSocket, setEngineSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isEngineConnected, setIsEngineConnected] = useState(false);
	const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
	const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([]);
	const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
	const [raceStarted, setRaceStarted] = useState(false);
	const [raceText, setRaceText] = useState<string | null>(null);
	const [racePlayers, setRacePlayers] = useState<RacePlayer[]>([]);
	const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);

	useEffect(() => {
		if (!authContext?.auth.isAuthenticated || !authContext.auth.token) {
			return;
		}

		const newSocket = io("http://localhost:3002", {
			withCredentials: true,
			auth: {
				token: authContext.auth.token,
			},
		});

		newSocket.on("connect", () => {
			console.log("Connected to game server");
			setIsConnected(true);
			newSocket.emit("get_rooms", (err: string | null, rooms?: RoomListItem[]) => {
				if (!err && rooms) {
					setAvailableRooms(rooms);
				}
			});
		});

		newSocket.on("disconnect", () => {
			console.log("Disconnected from game server");
			setIsConnected(false);
		});

		newSocket.on("room_state", (state: RoomState) => {
			console.log("Room state updated:", state);
			setCurrentRoom(state);
		});

		newSocket.on("player_joined", (data: { userId: number; username: string; socketId: string }) => {
			console.log("Player joined:", data);
			newSocket.emit("get_rooms", (err: string | null, rooms?: RoomListItem[]) => {
				if (!err && rooms) setAvailableRooms(rooms);
			});
		});

		newSocket.on("player_left", (data: { userId: number; username: string; socketId: string }) => {
			console.log("Player left:", data);
			newSocket.emit("get_rooms", (err: string | null, rooms?: RoomListItem[]) => {
				if (!err && rooms) setAvailableRooms(rooms);
			});
		});

		newSocket.on("countdown_start", (data: { seconds: number }) => {
			console.log("Countdown starting:", data.seconds);
			setCountdownSeconds(data.seconds);
			setRaceStarted(false);
		});

		newSocket.on("countdown_tick", (data: { secondsLeft: number }) => {
			console.log("Countdown:", data.secondsLeft);
			setCountdownSeconds(data.secondsLeft);
		});

		newSocket.on("race_start", (data: { startedAt: number }) => {
			console.log("Race started at:", data.startedAt);
			setCountdownSeconds(null);
			setRaceStarted(true);

			if (currentRoom) {
				newEngineSocket.emit("join_race", { roomId: currentRoom.id }, (err: string | null, session?: any) => {
					if (err) {
						console.error("Failed to join race:", err);
					} else {
						console.log("Joined race session:", session);
					}
				});
			}
		});

		newSocket.on("race_text", (data: { text: string }) => {
			console.log("Received race text:", data.text);
			setRaceText(data.text);
			setRaceResults(null);
		});

		setSocket(newSocket);

		const newEngineSocket = io("http://localhost:3003", {
			withCredentials: true,
		});

		newEngineSocket.on("connect", () => {
			console.log("Connected to game engine");
			setIsEngineConnected(true);
		});

		newEngineSocket.on("disconnect", () => {
			console.log("Disconnected from game engine");
			setIsEngineConnected(false);
		});
		newEngineSocket.on("race_started", (data: { roomId: string; text: string; startedAt: number }) => {
			console.log("Race started with text:", data.text);
			setRaceText(data.text);
			setRaceResults(null);

			newEngineSocket.emit("join_race", { roomId: data.roomId }, (err: string | null) => {
				if (err) console.error("Failed to join engine race:", err);
			});
		});

		newEngineSocket.on("race_state", (data: { roomId: string; status: string; players: RacePlayer[] }) => {
			console.log("Race state updated:", data);
			if (data.players && Array.isArray(data.players)) {
				setRacePlayers(data.players);
			}
		});

		newEngineSocket.on(
			"player_finished",
			(data: { userId: number; username: string; wpm: number; accuracy: number; finishedAt: number }) => {
				console.log("Player finished:", data);
			}
		);

		setEngineSocket(newEngineSocket);

		return () => {
			newSocket.close();
			newEngineSocket.close();
		};
	}, [authContext?.auth.isAuthenticated, authContext?.auth.token]);

	useEffect(() => {
		if (!engineSocket) return;

		const handleRaceFinished = (data: { results: RaceResult[] }) => {
			console.log("Race finished event received:", data);
			console.log("Results array:", data.results);

			if (data.results && Array.isArray(data.results)) {
				console.log("Updating raceResults state to:", data.results);
				setRaceResults(data.results);
			}
		};

		engineSocket.on("race_finished", handleRaceFinished);

		return () => {
			engineSocket.off("race_finished", handleRaceFinished);
		};
	}, [engineSocket]);

	useEffect(() => {
		if (currentRoom && engineSocket?.connected) {
			engineSocket.emit("join_race", { roomId: currentRoom.id }, (err: string | null) => {
				if (!err) console.log("Joined engine room:", currentRoom.id);
			});
		}
	}, [currentRoom?.id, engineSocket?.connected]);

	const getRooms = () => {
		if (!socket) return;
		socket.emit("get_rooms", (err: string | null, rooms?: RoomListItem[]) => {
			if (!err && rooms) {
				setAvailableRooms(rooms);
			}
		});
	};

	const createRoom = (maxPlayers: number = 2): Promise<{ roomId: string }> => {
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject(new Error("Not connected to server"));
				return;
			}

			socket.emit("create_room", { maxPlayers }, (err: string | null, room?: { roomId: string }) => {
				if (err) {
					reject(new Error(err));
				} else if (room) {
					resolve(room);
				} else {
					reject(new Error("Unknown error"));
				}
			});
		});
	};

	const joinRoom = (roomId: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject(new Error("Not connected to server"));
				return;
			}

			socket.emit("join_room", { roomId }, (err: string | null) => {
				if (err) {
					reject(new Error(err));
				} else {
					resolve();
				}
			});
		});
	};

	const leaveRoom = (roomId: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject(new Error("Not connected to server"));
				return;
			}

			socket.emit("leave_room", { roomId }, (err?: string) => {
				if (err) {
					reject(new Error(err));
				} else {
					setCurrentRoom(null);
					resolve();
				}
			});
		});
	};

	const startRace = (roomId: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			if (!socket) {
				reject(new Error("Not connected to server"));
				return;
			}

			socket.emit("start_race", { roomId }, (err?: string) => {
				if (err) {
					reject(new Error(err));
				} else {
					resolve();
				}
			});
		});
	};

	const updateProgress = (roomId: string, userId: number, progress: number, wpm: number, accuracy: number) => {
		if (!engineSocket) return;
		engineSocket.emit("update_progress", { roomId, userId, progress, wpm, accuracy });
	};

	return (
		<GameContext.Provider
			value={{
				socket,
				engineSocket,
				isConnected,
				isEngineConnected,
				currentRoom,
				availableRooms,
				countdownSeconds,
				raceStarted,
				raceText,
				racePlayers,
				raceResults,
				getRooms,
				createRoom,
				joinRoom,
				leaveRoom,
				startRace,
				updateProgress,
			}}
		>
			{children}
		</GameContext.Provider>
	);
};

export default GameContext;
