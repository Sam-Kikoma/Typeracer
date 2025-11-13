import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import { Toaster } from "./components/retroui/Sonner";
import Game from "./pages/Game";

const App = () => {
	return (
		<Router>
			<main className="p-4">
				<Navbar />
			</main>
			<Routes>
				<Route path="/auth" element={<AuthForm />} />
				<Route path="/game" element={<Game />} />
			</Routes>
			<Toaster />
		</Router>
	);
};

export default App;
