import {useEffect, useState} from 'react';
import {io, Socket} from 'socket.io-client';

interface RoomListItem {
	id: string;
	playerCount: number;
	maxPlayers: number;
	status: 'waiting' | 'countdown' | 'in-progress' | 'finished';
}

interface Player {
	userId: number;
	username: string;
	socketId: string;
}

interface RoomState {
	id: string;
	status: 'waiting' | 'countdown' | 'in-progress' | 'finished';
	players: Player[];
	maxPlayers: number;
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

export interface GameSocket {
	socket: Socket | null;
	engineSocket: Socket | null;
	isConnected: boolean;
	isEngineConnected: boolean;
	availableRooms: RoomListItem[];
	currentRoom: RoomState | null;
	countdownSeconds: number | null;
	raceStarted: boolean;
	raceText: string | null;
	racePlayers: RacePlayer[];
	raceResults: RaceResult[] | null;
	getRooms: () => void;
	createRoom: (maxPlayers?: number) => Promise<{roomId: string}>;
	joinRoom: (roomId: string) => Promise<void>;
	leaveRoom: (roomId: string) => Promise<void>;
	startRace: (roomId: string) => Promise<void>;
	updateProgress: (
		roomId: string,
		userId: number,
		progress: number,
		wpm: number,
		accuracy: number,
	) => void;
}

export const useGameSocket = (token: string | null): GameSocket => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [engineSocket, setEngineSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isEngineConnected, setIsEngineConnected] = useState(false);
	const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([]);
	const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
	const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
	const [raceStarted, setRaceStarted] = useState(false);
	const [raceText, setRaceText] = useState<string | null>(null);
	const [racePlayers, setRacePlayers] = useState<RacePlayer[]>([]);
	const [raceResults, setRaceResults] = useState<RaceResult[] | null>(null);

	useEffect(() => {
		if (!token) {
			return;
		}

		const newSocket = io('http://localhost:3002', {
			auth: {
				token,
			},
		});

		newSocket.on('connect', () => {
			setIsConnected(true);
			newSocket.emit(
				'get_rooms',
				(err: string | null, rooms?: RoomListItem[]) => {
					if (!err && rooms) {
						setAvailableRooms(rooms);
					}
				},
			);
		});

		newSocket.on('disconnect', () => {
			setIsConnected(false);
		});

		newSocket.on('room_list', (rooms: RoomListItem[]) => {
			setAvailableRooms(rooms);
		});

		newSocket.on('room_state', (room: RoomState) => {
			setCurrentRoom(room);
			if (room.status === 'waiting') {
				setRaceStarted(false);
				setRaceText(null);
				setRaceResults(null);
			}
		});

		newSocket.on('player_joined', () => {
			newSocket.emit(
				'get_rooms',
				(err: string | null, rooms?: RoomListItem[]) => {
					if (!err && rooms) {
						setAvailableRooms(rooms);
					}
				},
			);
		});

		newSocket.on('player_left', () => {
			newSocket.emit(
				'get_rooms',
				(err: string | null, rooms?: RoomListItem[]) => {
					if (!err && rooms) {
						setAvailableRooms(rooms);
					}
				},
			);
		});

		newSocket.on('countdown_start', (data: {seconds: number}) => {
			setCountdownSeconds(data.seconds);
		});

		newSocket.on('countdown_tick', (data: {secondsLeft: number}) => {
			setCountdownSeconds(data.secondsLeft);
		});

		newSocket.on('race_start', () => {
			setCountdownSeconds(null);
			setRaceStarted(true);

			// Join race on engine when game server signals race start
			if (currentRoom && newEngineSocket.connected) {
				newEngineSocket.emit(
					'join_race',
					{roomId: currentRoom.id},
					(err: string | null) => {
						if (err) {
							console.error('Failed to join race:', err);
						}
					},
				);
			}
		});

		newSocket.on('race_text', (data: {text: string}) => {
			setRaceText(data.text);
			setRacePlayers([]);
			setRaceResults(null);
		});

		setSocket(newSocket);

		// Connect to engine socket for race mechanics
		const newEngineSocket = io('http://localhost:3003');

		newEngineSocket.on('connect', () => {
			setIsEngineConnected(true);
		});

		newEngineSocket.on('disconnect', () => {
			setIsEngineConnected(false);
		});

		newEngineSocket.on(
			'race_started',
			(data: {roomId: string; text: string; startedAt: number}) => {
				setRaceText(data.text);
				setRacePlayers([]);
				setRaceResults(null);

				newEngineSocket.emit(
					'join_race',
					{roomId: data.roomId},
					(err: string | null) => {
						if (err) console.error('Failed to join engine race:', err);
					},
				);
			},
		);

		newEngineSocket.on(
			'race_state',
			(data: {roomId: string; status: string; players: RacePlayer[]}) => {
				setRacePlayers(data.players);
			},
		);

		setEngineSocket(newEngineSocket);

		return () => {
			newSocket.close();
			newEngineSocket.close();
		};
	}, [token]);

	// Separate effect for race_finished to match web client pattern
	useEffect(() => {
		if (!engineSocket) return;

		const handleRaceFinished = (data: {results: RaceResult[]}) => {
			if (data.results && Array.isArray(data.results)) {
				setRaceResults(data.results);
				setRaceStarted(false);
			}
		};

		engineSocket.on('race_finished', handleRaceFinished);

		return () => {
			engineSocket.off('race_finished', handleRaceFinished);
		};
	}, [engineSocket]);

	// Auto-join race when room changes and engine socket is connected
	useEffect(() => {
		if (!engineSocket || !engineSocket.connected || !currentRoom) {
			return;
		}

		if (currentRoom.status === 'in-progress') {
			engineSocket.emit(
				'join_race',
				{roomId: currentRoom.id},
				(err: string | null) => {
					if (err) {
						console.error('Failed to auto-join race:', err);
					}
				},
			);
		}
	}, [currentRoom, engineSocket]);

	// Auto-join race on engine when entering a room
	useEffect(() => {
		if (currentRoom && engineSocket?.connected) {
			engineSocket.emit(
				'join_race',
				{roomId: currentRoom.id},
				(err: string | null) => {
					if (!err) {
						// Successfully joined race on engine
					}
				},
			);
		}
	}, [currentRoom?.id, engineSocket?.connected]);

	const getRooms = () => {
		socket?.emit('get_rooms', (err: string | null, rooms?: RoomListItem[]) => {
			if (!err && rooms) {
				setAvailableRooms(rooms);
			}
		});
	};

	const createRoom = (maxPlayers = 4): Promise<{roomId: string}> => {
		return new Promise((resolve, reject) => {
			socket?.emit(
				'create_room',
				{maxPlayers},
				(err: string | null, result?: {roomId: string}) => {
					if (err) {
						reject(new Error(err));
					} else if (result) {
						resolve(result);
					}
				},
			);
		});
	};

	const joinRoom = (roomId: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			socket?.emit('join_room', {roomId}, (err: string | null) => {
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
			socket?.emit('leave_room', {roomId}, (err: string | null) => {
				if (err) {
					reject(new Error(err));
				} else {
					setCurrentRoom(null);
					setRaceStarted(false);
					setRaceText(null);
					setRacePlayers([]);
					setRaceResults(null);
					setCountdownSeconds(null);
					resolve();
				}
			});
		});
	};

	const startRace = (roomId: string): Promise<void> => {
		return new Promise((resolve, reject) => {
			socket?.emit('start_race', {roomId}, (err: string | null) => {
				if (err) {
					reject(new Error(err));
				} else {
					resolve();
				}
			});
		});
	};

	const updateProgress = (
		roomId: string,
		userId: number,
		progress: number,
		wpm: number,
		accuracy: number,
	) => {
		// Send progress updates to engine socket, not game socket
		if (!engineSocket) return;
		engineSocket.emit('update_progress', {
			roomId,
			userId,
			progress,
			wpm,
			accuracy,
		});
	};

	return {
		socket,
		engineSocket,
		isConnected,
		isEngineConnected,
		availableRooms,
		currentRoom,
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
	};
};
