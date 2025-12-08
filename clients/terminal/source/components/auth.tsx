import React, {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';

interface AuthProps {
	onAuth: (
		username: string,
		password: string,
		isSignup: boolean,
	) => Promise<void>;
}

const Auth = ({onAuth}: AuthProps) => {
	const [mode, setMode] = useState<'menu' | 'login' | 'signup'>('menu');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [inputField, setInputField] = useState<'username' | 'password'>(
		'username',
	);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useInput((input, key) => {
		if (loading) return;

		if (mode === 'menu') {
			if (input === '1') {
				setMode('login');
				setError(null);
			} else if (input === '2') {
				setMode('signup');
				setError(null);
			} else if (input === 'q' || key.escape) {
				process.exit(0);
			}
		} else if (key.escape) {
			setMode('menu');
			setUsername('');
			setPassword('');
			setInputField('username');
			setError(null);
		} else if (key.tab) {
			setInputField(prev => (prev === 'username' ? 'password' : 'username'));
		} else if (
			key.return &&
			inputField === 'password' &&
			username &&
			password
		) {
			setLoading(true);
			setError(null);
			onAuth(username, password, mode === 'signup').catch(err => {
				setError(err.message || 'Authentication failed');
				setLoading(false);
			});
		}
	});

	if (mode === 'menu') {
		return (
			<Box flexDirection="column" paddingX={2} paddingY={1}>
				<Text bold color="cyan">
					Welcome to TypeRacer Terminal!
				</Text>
				<Text> </Text>
				<Text>[1] Login</Text>
				<Text>[2] Sign Up</Text>
				<Text>[q] Quit</Text>
				<Text> </Text>
				{error && <Text color="red">Error: {error}</Text>}
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Text bold color="cyan">
				{mode === 'login' ? 'Login' : 'Sign Up'}
			</Text>
			<Text> </Text>
			<Box>
				<Text color={inputField === 'username' ? 'green' : 'white'}>
					Username:{' '}
				</Text>
				{inputField === 'username' ? (
					<TextInput value={username} onChange={setUsername} />
				) : (
					<Text>{username}</Text>
				)}
			</Box>
			<Box>
				<Text color={inputField === 'password' ? 'green' : 'white'}>
					Password:{' '}
				</Text>
				{inputField === 'password' ? (
					<TextInput value={password} onChange={setPassword} mask="*" />
				) : (
					<Text>{'*'.repeat(password.length)}</Text>
				)}
			</Box>
			<Text> </Text>
			{loading ? (
				<Text color="yellow">Authenticating...</Text>
			) : (
				<Text dimColor>[Tab] Switch field | [Enter] Submit | [Esc] Back</Text>
			)}
			{error && <Text color="red">Error: {error}</Text>}
		</Box>
	);
};

export default Auth;
