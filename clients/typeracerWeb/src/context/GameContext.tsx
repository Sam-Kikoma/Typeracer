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

interface GameContextType {
	socket: Socket | null;
	isConnected: boolean;
	currentRoom: RoomState | null;
	availableRooms: RoomListItem[];
	countdownSeconds: number | null;
	raceStarted: boolean;
	getRooms: () => void;
	createRoom: (maxPlayers?: number) => Promise<{ roomId: string }>;
	joinRoom: (roomId: string) => Promise<void>;
	leaveRoom: (roomId: string) => Promise<void>;
	startRace: (roomId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
	const authContext = useContext(AuthContext);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
	const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([]);
	const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
	const [raceStarted, setRaceStarted] = useState(false);

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
		});

		setSocket(newSocket);

		return () => {
			newSocket.close();
		};
	}, [authContext?.auth.isAuthenticated, authContext?.auth.token]);

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

	return (
		<GameContext.Provider
			value={{
				socket,
				isConnected,
				currentRoom,
				availableRooms,
				countdownSeconds,
				raceStarted,
				getRooms,
				createRoom,
				joinRoom,
				leaveRoom,
				startRace,
			}}
		>
			{children}
		</GameContext.Provider>
	);
};

export default GameContext;
