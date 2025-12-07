import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthContextProvider } from "./context/AuthContext.tsx";
import { GameContextProvider } from "./context/GameContext.tsx";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthContextProvider>
			<GameContextProvider>
				<App />
			</GameContextProvider>
		</AuthContextProvider>
	</StrictMode>
);
