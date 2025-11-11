import { Link } from "react-router-dom";
import { Button } from "./retroui/Button";
import { AiOutlineMenu } from "react-icons/ai";
import { AiOutlineClose } from "react-icons/ai";
import { useState, useEffect } from "react";

const Navbar = () => {
	const [nav, setNav] = useState<boolean>(false);
	const handleNav = () => setNav(!nav);

	// Close mobile menu when resizing to desktop view
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
			name: "Home",
			path: "/",
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
			<Button className="hidden md:block">Login</Button>
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
				{/* <h1 className="text-3xl font-bold p-4 border-b border-zinc-800">TypeRacer</h1> */}
				<ul className="uppercase p-4 flex flex-col justify-evenly h-[50%]">
					{navItems.map((item) => (
						<li key={item.name}>
							<Link to={item.path} className="hover:text-gray-300 transition-colors text-lg" onClick={handleNav}>
								{item.name}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default Navbar;
