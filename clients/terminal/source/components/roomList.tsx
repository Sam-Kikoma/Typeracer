import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import type {GameSocket} from '../hooks/useGameSocket.js';

interface User {
	id: number;
	username: string;
}

interface RoomListProps {
	gameSocket: GameSocket;
	user: User;
	onJoinRoom: (roomId: string) => void;
}

const RoomList = ({gameSocket, user, onJoinRoom}: RoomListProps) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			gameSocket.getRooms();
		}, 2000);

		return () => clearInterval(interval);
	}, [gameSocket]);

	useInput((input, key) => {
		if (loading) return;

		if (key.upArrow) {
			setSelectedIndex(prev =>
				prev > 0 ? prev - 1 : gameSocket.availableRooms.length,
			);
		} else if (key.downArrow) {
			setSelectedIndex(prev =>
				prev < gameSocket.availableRooms.length ? prev + 1 : 0,
			);
		} else if (key.return) {
			if (selectedIndex === gameSocket.availableRooms.length) {
				// Create new room
				setLoading(true);
				setError(null);
				gameSocket
					.createRoom(2)
					.then(result => {
						onJoinRoom(result.roomId);
					})
					.catch(err => {
						setError(err.message);
						setLoading(false);
					});
			} else {
				// Join selected room
				const room = gameSocket.availableRooms[selectedIndex];
				if (room && room.status === 'waiting') {
					setLoading(true);
					setError(null);
					gameSocket
						.joinRoom(room.id)
						.then(() => {
							onJoinRoom(room.id);
						})
						.catch(err => {
							setError(err.message);
							setLoading(false);
						});
				}
			}
		} else if (input === 'r') {
			gameSocket.getRooms();
		} else if (input === 'q') {
			process.exit(0);
		}
	});

	if (!gameSocket.isConnected) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="yellow">Connecting to game server...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Text bold color="cyan">
				Welcome, {user.username}!
			</Text>
			<Text> </Text>
			<Text bold>Available Rooms:</Text>
			<Text> </Text>

			{gameSocket.availableRooms.length === 0 ? (
				<Text dimColor>No rooms available. Create one!</Text>
			) : (
				gameSocket.availableRooms.map((room, index) => (
					<Box key={room.id}>
						<Text
							color={selectedIndex === index ? 'green' : 'white'}
							bold={selectedIndex === index}
						>
							{selectedIndex === index ? '> ' : '  '}
							Room {room.id.slice(0, 8)} - {room.playerCount}/{room.maxPlayers}{' '}
							players - {room.status}
						</Text>
					</Box>
				))
			)}

			<Box>
				<Text
					color={
						selectedIndex === gameSocket.availableRooms.length
							? 'green'
							: 'white'
					}
					bold={selectedIndex === gameSocket.availableRooms.length}
				>
					{selectedIndex === gameSocket.availableRooms.length ? '> ' : '  '}
					[Create New Room]
				</Text>
			</Box>

			<Text> </Text>
			{loading ? (
				<Text color="yellow">Processing...</Text>
			) : (
				<>
					<Text dimColor>
						[↑↓] Navigate | [Enter] Select | [r] Refresh | [q] Quit
					</Text>
					{error && <Text color="red">Error: {error}</Text>}
				</>
			)}
		</Box>
	);
};

export default RoomList;
