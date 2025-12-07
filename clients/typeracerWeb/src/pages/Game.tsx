import { useContext, useEffect } from "react";
import { Table } from "../components/retroui/Table";
import GameContext from "../context/GameContext";
import { toast } from "sonner";

const Game = () => {
	const gameContext = useContext(GameContext);

	useEffect(() => {
		if (!gameContext?.isConnected) return;
		gameContext.getRooms();
	}, [gameContext?.isConnected]);

	const handleCreateRoom = async () => {
		try {
			const { roomId } = await gameContext!.createRoom(2);
			toast.success(`Room created: ${roomId}`);
		} catch (error: any) {
			toast.error(error.message || "Failed to create room");
		}
	};

	const handleJoinRoom = async (roomId: string) => {
		try {
			await gameContext!.joinRoom(roomId);
			toast.success(`Joined room: ${roomId}`);
		} catch (error: any) {
			toast.error(error.message || "Failed to join room");
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Game Rooms</h1>
				<button
					onClick={handleCreateRoom}
					disabled={!gameContext?.isConnected}
					className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
				>
					Create Room
				</button>
			</div>

			{!gameContext?.isConnected && <div className="text-yellow-600">Connecting to game server...</div>}

			{gameContext?.currentRoom && (
				<div className="bg-green-100 p-4 rounded">
					<div className="flex justify-between items-center mb-2">
						<h2 className="font-bold">Current Room: {gameContext.currentRoom.id}</h2>
						<button
							onClick={() => gameContext.startRace(gameContext.currentRoom!.id)}
							disabled={gameContext.currentRoom.status !== "waiting"}
							className="px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-400"
						>
							Start Race
						</button>
					</div>
					<p>Status: {gameContext.currentRoom.status}</p>
					<p>
						Players: {gameContext.currentRoom.players.length}/{gameContext.currentRoom.maxPlayers}
					</p>

					{gameContext.countdownSeconds !== null && (
						<div className="mt-4 text-4xl font-bold text-center text-orange-600">{gameContext.countdownSeconds}</div>
					)}

					{gameContext.raceStarted && (
						<div className="mt-4 text-2xl font-bold text-center text-green-600">RACE STARTED! 🏁</div>
					)}

					<div className="mt-2">
						{gameContext.currentRoom.players.map((player) => (
							<div key={player.socketId}>• {player.username}</div>
						))}
					</div>
				</div>
			)}

			<div>
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.Head>Room ID</Table.Head>
							<Table.Head>Status</Table.Head>
							<Table.Head>Players</Table.Head>
							<Table.Head>Action</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{gameContext?.availableRooms.map((room) => (
							<Table.Row key={room.id}>
								<Table.Cell>{room.id}</Table.Cell>
								<Table.Cell>{room.status}</Table.Cell>
								<Table.Cell>
									{room.playerCount}/{room.maxPlayers}
								</Table.Cell>
								<Table.Cell>
									<button
										onClick={() => handleJoinRoom(room.id)}
										disabled={!gameContext?.isConnected || room.playerCount >= room.maxPlayers}
										className="px-3 py-1 bg-green-500 text-white rounded disabled:bg-gray-400"
									>
										Join
									</button>
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
				</Table>
			</div>
		</div>
	);
};

export default Game;
