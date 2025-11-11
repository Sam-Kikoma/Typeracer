import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar";

const App = () => {
	return (
		<Router>
			<main className="p-4">
				<Navbar />
			</main>
		</Router>
	);
};

export default App;
