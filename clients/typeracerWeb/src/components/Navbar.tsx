import { Link, useNavigate } from "react-router-dom";
import { Button } from "./retroui/Button";
import { AiOutlineMenu } from "react-icons/ai";
import { AiOutlineClose } from "react-icons/ai";
import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { toast } from "sonner";

const Navbar = () => {
	const [nav, setNav] = useState<boolean>(false);
	const handleNav = () => setNav(!nav);

	const navigate = useNavigate();
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("Navbar must be used within AuthContextProvider");
	}
	const { auth, authDispatch } = context;

	const handleLogout = () => {
		authDispatch({ type: "LOGOUT" });
		toast.success("Logged out!");
		navigate("/");
	};

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768 && nav) {
				setNav(false);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [nav]);

	const navItems = [
		{
			name: "Game",
			path: "/game",
		},
		{
			name: "Leaderboard",
			path: "/leaderboard",
		},
		{
			name: "Stats",
			path: "/stats",
		},
	];

	return (
		<div className="flex items-center justify-between pb-4 border-b-2 border-zinc-950">
			<h1 className="text-3xl font-bold">TypeRacer</h1>
			<ul className="hidden md:flex gap-8 items-center">
				{navItems.map((item) => (
					<li key={item.name}>
						<Link to={item.path} className="hover:text-gray-300 transition-colors">
							{item.name}
						</Link>
					</li>
				))}
			</ul>
			{auth.isAuthenticated && auth.user && auth.token ? (
				<Button className="hidden md:block" onClick={handleLogout}>
					Logout
				</Button>
			) : (
				<Button className="hidden md:block">
					<Link to="/auth">Login</Link>
				</Button>
			)}
			<div onClick={handleNav} className="block md:hidden cursor-pointer">
				{nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
			</div>

			<div
				className={
					nav
						? "fixed left-0 top-0 w-[80%] h-full border-r border-r-gray-900 ease-in-out duration-500 z-50 bg-primary"
						: "fixed left-[-100%] z-50"
				}
			>
				<ul className="uppercase p-4 flex flex-col justify-evenly h-[50%]">
					{navItems.map((item) => (
						<li key={item.name}>
							<Link to={item.path} className="hover:text-gray-300 transition-colors text-lg" onClick={handleNav}>
								{item.name}
							</Link>
						</li>
					))}
					<li>
						{auth.isAuthenticated && auth.user && auth.token ? (
							<button onClick={handleLogout} className="hover:text-gray-300 transition-colors text-lg">
								Logout
							</button>
						) : (
							<Link to="/auth" className="hover:text-gray-300 transition-colors text-lg">
								Login
							</Link>
						)}
					</li>
				</ul>
			</div>
		</div>
	);
};

export default Navbar;
