import React, {useState} from 'react';
import {Box} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import Auth from './components/auth.js';
import RoomList from './components/roomList.js';
import Race from './components/race.js';
import {login, signup} from './services/auth.js';
import {useGameSocket} from './hooks/useGameSocket.js';

interface User {
	id: number;
	username: string;
}

type AppState = 'auth' | 'rooms' | 'race';

export default function App() {
	const [state, setState] = useState<AppState>('auth');
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

	const gameSocket = useGameSocket(token);

	const handleAuth = async (
		username: string,
		password: string,
		isSignup: boolean,
	) => {
		const authFn = isSignup ? signup : login;
		const {token: authToken, user: authUser} = await authFn({
			username,
			password,
		});
		setToken(authToken);
		setUser(authUser);
		setState('rooms');
	};

	const handleJoinRoom = (roomId: string) => {
		setCurrentRoomId(roomId);
		setState('race');
	};

	const handleLeaveRoom = () => {
		setCurrentRoomId(null);
		setState('rooms');
	};

	return (
		<Box flexDirection="column">
			<Gradient name="fruit">
				<BigText text="TYPERACER" align="center" font="3d" />
			</Gradient>
			{state === 'auth' && <Auth onAuth={handleAuth} />}
			{state === 'rooms' && user && (
				<RoomList
					gameSocket={gameSocket}
					user={user}
					onJoinRoom={handleJoinRoom}
				/>
			)}
			{state === 'race' && user && currentRoomId && (
				<Race
					gameSocket={gameSocket}
					user={user}
					roomId={currentRoomId}
					onLeave={handleLeaveRoom}
				/>
			)}
		</Box>
	);
}
