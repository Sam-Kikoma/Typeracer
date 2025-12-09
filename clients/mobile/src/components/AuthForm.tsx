import { Card } from "./retroui/Card";
import { Label } from "./retroui/Label";
import { Input } from "./retroui/Input";
import { Button } from "./retroui/Button";
import { useContext, useState, FormEvent } from "react";
import AuthContext from "../context/AuthContext";
import { loginReq, signupReq } from "../services/Auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AuthForm = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("AuthForm must be used within AuthContextProvider");
	}
	const { authDispatch } = context;
	const navigte = useNavigate();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const response = await loginReq({ username, password });
			authDispatch({
				type: "LOGIN",
				payload: { user: response.user, token: response.token },
			});
			toast.success(`Welcome back, ${response.user.username}!`);
			navigte("/game");
		} catch (err: any) {
			const errorMsg = err.response?.data?.error || "Login failed";
			setError(errorMsg);
			toast.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleSignup = async (e: FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const response = await signupReq({ username, password });
			authDispatch({
				type: "LOGIN",
				payload: { user: response.user, token: response.token },
			});
			toast.success("Account created successfully!");
			navigte("/game");
		} catch (err: any) {
			const errorMsg = err.response?.data?.error || "Signup failed";
			setError(errorMsg);
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-[450px] flex justify-center mx-auto mt-10 px-8">
			<Card>
				<Card.Header>
					<Card.Title>Welcome to TypeRacer</Card.Title>
				</Card.Header>
				<Card.Content>
					<form onSubmit={handleLogin}>
						<Label htmlFor="username">Username</Label>
						<Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
						<Label htmlFor="password">Password</Label>
						<Input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>

						<div className="flex justify-center mt-4 gap-2">
							<Button type="button" onClick={handleSignup} disabled={loading}>
								Sign Up
							</Button>
							<Button type="submit" variant="secondary" disabled={loading}>
								{loading ? "Loading..." : "Login"}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card>
		</div>
	);
};

export default AuthForm;
