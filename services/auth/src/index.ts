import app from "./app.ts";
import { PORT } from "./utils/config.ts";

app.listen(PORT, () => {
	console.log(`Auth service is live on ${PORT}`);
});
