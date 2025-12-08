interface RaceSession {
	roomId: string;
	text: string;
	startedAt: number;
	players: Map<
		number,
		{
			userId: number;
			username: string;
			progress: number;
			wpm: number;
			accuracy: number;
			finished: boolean;
			finishedAt?: number;
		}
	>;
	status: "waiting" | "active" | "finished";
}

const raceSessions = new Map<string, RaceSession>();

// Sample texts for typing
const sampleTexts = [
	"Courage grows when we take one small step beyond our comfort each day.",
	"Light appears even in the darkest hour when we choose to keep moving forward.",
	"Strength is found not in perfection but in steady effort through every storm.",
	"Every new path begins with a single brave decision.",
	"Peace comes when we release fear and trust the journey ahead.",
	"Hope becomes powerful when we share it with another soul.",
	"True wisdom lives in quiet moments where the heart listens before it speaks.",
	"Kindness can change a life long before we notice its impact.",
	"Greatness begins in ordinary choices made with purpose.",
	"Joy grows when gratitude guides the way.",
];

export const createRaceSession = (roomId: string, players: Array<{ userId: number; username: string }>) => {
	const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

	const playerMap = new Map();
	players.forEach((p) => {
		playerMap.set(p.userId, {
			userId: p.userId,
			username: p.username,
			progress: 0,
			wpm: 0,
			accuracy: 100,
			finished: false,
		});
	});

	const session: RaceSession = {
		roomId,
		text,
		startedAt: Date.now(),
		players: playerMap,
		status: "active",
	};

	raceSessions.set(roomId, session);
	return session;
};

export const getRaceSession = (roomId: string) => {
	return raceSessions.get(roomId);
};

export const updatePlayerProgress = (
	roomId: string,
	userId: number,
	progress: number,
	wpm: number,
	accuracy: number
) => {
	const session = raceSessions.get(roomId);
	if (!session) return null;

	const player = session.players.get(userId);
	if (!player) return null;

	player.progress = progress;
	player.wpm = wpm;
	player.accuracy = accuracy;

	if (progress >= 100 && !player.finished) {
		player.finished = true;
		player.finishedAt = Date.now();
	}

	return session;
};

export const checkRaceFinished = (roomId: string) => {
	const session = raceSessions.get(roomId);
	if (!session) return false;

	const allFinished = Array.from(session.players.values()).every((p) => p.finished);

	if (allFinished && session.status !== "finished") {
		session.status = "finished";
		return true;
	}

	return false;
};

export const getRaceResults = (roomId: string) => {
	const session = raceSessions.get(roomId);
	if (!session) return null;

	const results = Array.from(session.players.values())
		.sort((a, b) => {
			if (a.finished && !b.finished) return -1;
			if (!a.finished && b.finished) return 1;
			if (a.finishedAt && b.finishedAt) return a.finishedAt - b.finishedAt;
			return b.wpm - a.wpm;
		})
		.map((p, index) => ({
			position: index + 1,
			userId: p.userId,
			username: p.username,
			wpm: p.wpm,
			accuracy: p.accuracy,
			finished: p.finished,
		}));

	return results;
};

export const deleteRaceSession = (roomId: string) => {
	raceSessions.delete(roomId);
};
