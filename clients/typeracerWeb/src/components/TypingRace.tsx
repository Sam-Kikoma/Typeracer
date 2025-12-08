import { useContext, useEffect, useState, useRef } from "react";
import GameContext from "../context/GameContext";
import AuthContext from "../context/AuthContext";

const TypingRace = () => {
	const gameContext = useContext(GameContext);
	const authContext = useContext(AuthContext);
	const [userInput, setUserInput] = useState("");
	const [startTime, setStartTime] = useState<number | null>(null);
	const [errors, setErrors] = useState(0);
	const [hasFinished, setHasFinished] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (gameContext?.raceText && !gameContext.raceResults) {
			inputRef.current?.focus();
			setStartTime(Date.now());
			setUserInput("");
			setErrors(0);
		}
	}, [gameContext?.raceText]);

	useEffect(() => {
		console.log("Race results changed:", gameContext?.raceResults);
	}, [gameContext?.raceResults]);

	const calculateWPM = () => {
		if (!startTime || !userInput.length) return 0;
		const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
		const wordsTyped = userInput.trim().split(/\s+/).length;
		return Math.round(wordsTyped / timeElapsed);
	};

	const calculateAccuracy = () => {
		if (!gameContext?.raceText || !userInput.length) return 100;
		const totalChars = userInput.length;
		const correctChars = userInput.split("").filter((char, i) => char === gameContext.raceText![i]).length;
		return Math.round((correctChars / totalChars) * 100);
	};

	const calculateProgress = () => {
		if (!gameContext?.raceText) return 0;
		const progress = (userInput.length / gameContext.raceText.length) * 100;
		return userInput === gameContext.raceText ? 100 : Math.min(Math.round(progress), 99);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (hasFinished) return;

		const input = e.target.value;
		setUserInput(input);

		// Count errors
		const newErrors = input.split("").filter((char, i) => char !== gameContext?.raceText![i]).length;
		setErrors(newErrors);

		// Calculate stats
		const wpm = calculateWPM();
		const accuracy = calculateAccuracy();
		const progress = Math.min(Math.round((input.length / gameContext.raceText!.length) * 100), 99);

		if (gameContext?.currentRoom && authContext?.auth.user) {
			gameContext.updateProgress(gameContext.currentRoom.id, authContext.auth.user.id, progress, wpm, accuracy);
		}
	};

	const handleFinishRace = () => {
		if (hasFinished) return;
		setHasFinished(true);

		const wpm = calculateWPM();
		const accuracy = calculateAccuracy();

		if (gameContext?.currentRoom && authContext?.auth.user) {
			gameContext.updateProgress(gameContext.currentRoom.id, authContext.auth.user.id, 100, wpm, accuracy);
		}
	};

	const getCharClass = (index: number) => {
		if (index >= userInput.length) return "text-gray-400";
		if (userInput[index] === gameContext?.raceText![index]) return "text-green-600";
		return "text-red-600";
	};

	if (!gameContext?.raceText) return null;

	console.log("TypingRace render - raceResults:", gameContext.raceResults);

	return (
		<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold">Type the text below:</h2>
				<div className="flex gap-4 text-sm">
					<span>
						WPM: <strong>{calculateWPM()}</strong>
					</span>
					<span>
						Accuracy: <strong>{calculateAccuracy()}%</strong>
					</span>
					<span>
						Progress: <strong>{calculateProgress()}%</strong>
					</span>
				</div>
			</div>

			<div className="p-4 bg-gray-50 rounded text-lg font-mono leading-relaxed">
				{gameContext.raceText.split("").map((char, index) => (
					<span key={index} className={getCharClass(index)}>
						{char}
					</span>
				))}
			</div>

			<div className="flex gap-2">
				<input
					ref={inputRef}
					type="text"
					value={userInput}
					onChange={handleInputChange}
					disabled={hasFinished}
					className="flex-1 p-3 border-2 border-gray-300 rounded text-lg font-mono focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
					placeholder="Start typing..."
				/>
				<button
					onClick={handleFinishRace}
					disabled={hasFinished || !userInput}
					className="px-6 py-3 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
				>
					{hasFinished ? "Finished!" : "Finish Race"}
				</button>
			</div>

			<div className="mt-4">
				<h3 className="text-sm font-bold mb-2">Players:</h3>
				{gameContext.racePlayers.map((player) => (
					<div key={player.userId} className="mb-2">
						<div className="flex justify-between text-sm mb-1">
							<span className={player.userId === authContext?.auth.user?.id ? "font-bold" : ""}>
								{player.username} {player.finished && "🏁"}
							</span>
							<span>
								{player.wpm} WPM | {player.accuracy}%
							</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className={`h-2 rounded-full transition-all ${player.finished ? "bg-green-500" : "bg-blue-500"}`}
								style={{ width: `${player.progress}%` }}
							/>
						</div>
					</div>
				))}
			</div>

			{hasFinished && (!gameContext.raceResults || gameContext.raceResults.length === 0) && (
				<div className="mt-4 p-6 bg-blue-50 rounded border-2 border-blue-500 text-center">
					<h3 className="text-2xl font-bold mb-4">You Finished! 🎉</h3>
					<p className="mb-4">Waiting for other players to finish...</p>
					<div className="flex justify-center gap-8">
						<div>
							<p className="text-sm text-gray-600">Your WPM</p>
							<p className="text-3xl font-bold">{calculateWPM()}</p>
						</div>
						<div>
							<p className="text-sm text-gray-600">Your Accuracy</p>
							<p className="text-3xl font-bold">{calculateAccuracy()}%</p>
						</div>
					</div>
				</div>
			)}

			{gameContext.raceResults && gameContext.raceResults.length > 0 ? (
				<div className="mt-4 p-4 bg-green-50 rounded border-2 border-green-500">
					<h3 className="text-xl font-bold mb-2">Race Results 🏆</h3>
					{gameContext.raceResults.map((result) => (
						<div key={result.userId} className="flex justify-between py-2 border-b">
							<span>
								{result.position}. {result.username}
							</span>
							<span>
								{result.wpm} WPM | {result.accuracy}% accuracy
							</span>
						</div>
					))}
				</div>
			) : userInput === gameContext.raceText ? (
				<div className="mt-4 p-4 bg-blue-50 rounded border-2 border-blue-500">
					<h3 className="text-xl font-bold mb-2">You Finished! 🎉</h3>
					<p className="text-lg">Waiting for other players to finish...</p>
					<div className="mt-2">
						<p>Your Stats:</p>
						<p>
							WPM: <strong>{calculateWPM()}</strong>
						</p>
						<p>
							Accuracy: <strong>{calculateAccuracy()}%</strong>
						</p>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default TypingRace;
