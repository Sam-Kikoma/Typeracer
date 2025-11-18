import express from "express";

const app = express();
const PORT = 3002;

app.get("/", (req, res) => {
	res.send("Game Room Service is live");
});

app.listen(PORT, () => {
	console.log(`Game Room Service is running on port: ${PORT}`);
});
