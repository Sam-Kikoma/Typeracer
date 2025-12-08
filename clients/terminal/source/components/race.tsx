import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import type {GameSocket} from '../hooks/useGameSocket.js';

interface User {
	id: number;
	username: string;
}

interface RaceProps {
	gameSocket: GameSocket;
	user: User;
	roomId: string;
	onLeave: () => void;
}

const Race = ({gameSocket, user, roomId, onLeave}: RaceProps) => {
	const [input, setInput] = useState('');
	const [startTime, setStartTime] = useState<number | null>(null);
	const [errors, setErrors] = useState(0);
	const [totalKeystrokes, setTotalKeystrokes] = useState(0);

	const raceText = gameSocket.raceText || '';
	const currentRoom = gameSocket.currentRoom;
	const isOwner = currentRoom?.players[0]?.userId === user.id;

	useEffect(() => {
		if (gameSocket.raceStarted && !startTime) {
			setStartTime(Date.now());
		}
	}, [gameSocket.raceStarted, startTime]);

	useEffect(() => {
		if (gameSocket.raceStarted && startTime) {
			const interval = setInterval(() => {
				const progress = Math.min(
					100,
					Math.round((input.length / raceText.length) * 100),
				);

				// Stop sending updates once we reach 100%
				if (progress >= 100) {
					clearInterval(interval);
					return;
				}

				const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
				const wordsTyped = input.trim().split(/\s+/).length;
				const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
				const accuracy =
					totalKeystrokes > 0
						? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100)
						: 100;

				gameSocket.updateProgress(roomId, user.id, progress, wpm, accuracy);
			}, 500);

			return () => clearInterval(interval);
		}
		return undefined;
	}, [
		gameSocket,
		roomId,
		user.id,
		input,
		raceText,
		startTime,
		errors,
		totalKeystrokes,
	]);

	useInput((char, key) => {
		if (gameSocket.countdownSeconds !== null) return;

		// Handle results screen
		if (gameSocket.raceResults) {
			if (key.escape) {
				gameSocket.leaveRoom(roomId).then(() => onLeave());
			}
			return;
		}

		if (!gameSocket.raceStarted) {
			// Pre-race controls
			if (key.escape) {
				gameSocket.leaveRoom(roomId).then(() => onLeave());
			} else if (char === 's' && isOwner && currentRoom?.players.length! >= 2) {
				gameSocket.startRace(roomId);
			}
		} else {
			// During race
			if (key.escape) {
				// Leave race and return to room list
				gameSocket.leaveRoom(roomId).then(() => onLeave());
				return;
			}

			if (key.backspace || key.delete) {
				setInput(prev => prev.slice(0, -1));
			} else if (char) {
				setTotalKeystrokes(prev => prev + 1);
				const nextIndex = input.length;
				if (char !== raceText[nextIndex]) {
					setErrors(prev => prev + 1);
				}
				setInput(prev => prev + char);

				// Check if finished
				if (input.length + 1 >= raceText.length) {
					const progress = 100;
					const timeElapsed = (Date.now() - startTime!) / 1000 / 60;
					const wordsTyped = raceText.trim().split(/\s+/).length;
					const wpm = Math.round(wordsTyped / timeElapsed);
					const accuracy = Math.round(
						((totalKeystrokes + 1 - errors) / (totalKeystrokes + 1)) * 100,
					);
					gameSocket.updateProgress(roomId, user.id, progress, wpm, accuracy);
				}
			}
		}
	});

	if (!currentRoom) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text color="yellow">Loading room...</Text>
			</Box>
		);
	}

	// Show results screen
	if (gameSocket.raceResults) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text bold color="cyan">
					Race Finished!
				</Text>
				<Text> </Text>
				<Text bold>Results:</Text>
				{gameSocket.raceResults.map((result, index) => (
					<Text
						key={result.userId}
						color={result.userId === user.id ? 'green' : 'white'}
					>
						{index + 1}. {result.username} - {result.wpm} WPM -{' '}
						{result.accuracy}% accuracy
					</Text>
				))}
				<Text> </Text>
				<Text dimColor>[Esc] Leave room</Text>
			</Box>
		);
	}

	// Show countdown
	if (gameSocket.countdownSeconds !== null) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text bold color="yellow">
					Race starting in {gameSocket.countdownSeconds}...
				</Text>
			</Box>
		);
	}

	// Show waiting lobby
	if (!gameSocket.raceStarted) {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text bold color="cyan">
					Room: {roomId.slice(0, 8)}
				</Text>
				<Text> </Text>
				<Text bold>
					Players ({currentRoom.players.length}/{currentRoom.maxPlayers}):
				</Text>
				{currentRoom.players.map((player, index) => (
					<Text key={player.socketId}>
						{index === 0 ? '👑 ' : '   '}
						{player.username}
						{player.userId === user.id ? ' (You)' : ''}
					</Text>
				))}
				<Text> </Text>
				{isOwner ? (
					<Text color="green">
						[s] Start race (need at least 2 players) | [Esc] Leave
					</Text>
				) : (
					<Text dimColor>Waiting for host to start... | [Esc] Leave</Text>
				)}
			</Box>
		);
	}

	// Show race in progress
	const displayText = raceText.split('').map((char, index) => {
		if (index < input.length) {
			const color = input[index] === char ? 'green' : 'red';
			return {char, color};
		}
		return {char, color: 'white'};
	});

	const progress = (input.length / raceText.length) * 100;
	const timeElapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 0;
	const wordsTyped = input.trim().split(/\s+/).length;
	const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
	const accuracy =
		totalKeystrokes > 0
			? Math.round(((totalKeystrokes - errors) / totalKeystrokes) * 100)
			: 100;

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Text bold color="cyan">
				Race in Progress
			</Text>
			<Text> </Text>

			{/* Race Text */}
			<Box flexDirection="row" flexWrap="wrap" width={80}>
				{displayText.map((item, index) => (
					<Text key={index} color={item.color}>
						{item.char}
					</Text>
				))}
			</Box>

			<Text> </Text>

			{/* Your Stats */}
			<Box flexDirection="column">
				<Text>
					Progress: {Math.round(progress)}% | WPM: {wpm} | Accuracy: {accuracy}%
				</Text>
			</Box>

			<Text> </Text>
			<Text dimColor>[Esc] Leave race</Text>

			<Text> </Text>

			{/* Other Players */}
			<Text bold>Leaderboard:</Text>
			{gameSocket.racePlayers
				.sort((a, b) => b.progress - a.progress)
				.map((player, index) => (
					<Text
						key={player.userId}
						color={player.userId === user.id ? 'green' : 'white'}
					>
						{index + 1}. {player.username} - {Math.round(player.progress)}% -{' '}
						{player.wpm} WPM
					</Text>
				))}
		</Box>
	);
};

export default Race;
