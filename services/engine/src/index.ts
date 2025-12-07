import express from "express";

const app = express();
const port = 3003;

app.get("/", (req, res) => {
	res.send("Game Engine lives!");
});

app.listen(port, () => {
	console.log(`Game engine is running on PORT ${port}`);
});
