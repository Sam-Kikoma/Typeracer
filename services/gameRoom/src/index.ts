import express from "express";
import cors from "cors";
import roomRouter from "./routes/room.ts";

console.log("=== SERVER STARTING ===");

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use(express.json());

// Move logging middleware BEFORE routes
app.use((req, res, next) => {
	console.log(`[REQUEST] ${req.method} ${req.url}`);
	next();
});

const PORT = 3002;

app.get("/", (req, res) => {
	console.log("Root route hit");
	res.send("Game Room Service is live");
});

console.log("Registering /api/rooms router...");
console.log("roomRouter type:", typeof roomRouter);
console.log("roomRouter:", roomRouter);

app.use("/api/rooms", roomRouter);

app.listen(PORT, () => {
	console.log(`=== SERVER RUNNING ON PORT ${PORT} ===`);
	console.log(`Routes available:`);
	console.log(`  GET  http://localhost:${PORT}/`);
	console.log(`  GET  http://localhost:${PORT}/api/rooms`);
});
