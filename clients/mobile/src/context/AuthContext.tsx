import { useReducer, createContext, ReactNode } from "react";

interface User {
	id: number;
	username: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

type AuthAction =
	| { type: "LOGIN"; payload: { user: User; token: string } }
	| { type: "LOGOUT" }
	| { type: "SET_USER"; payload: User };

interface AuthContextType {
	auth: AuthState;
	authDispatch: React.Dispatch<AuthAction>;
}

const getUserFromStorage = (): User | null => {
	const userStr = localStorage.getItem("user");
	if (userStr) {
		try {
			return JSON.parse(userStr);
		} catch {
			return null;
		}
	}
	return null;
};

const initialState: AuthState = {
	user: getUserFromStorage(),
	token: localStorage.getItem("token"),
	isAuthenticated: !!localStorage.getItem("token"),
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case "LOGIN":
			localStorage.setItem("user", JSON.stringify(action.payload.user));
			localStorage.setItem("token", action.payload.token);
			return {
				...state,
				user: action.payload.user,
				token: action.payload.token,
				isAuthenticated: true,
			};
		case "LOGOUT":
			localStorage.removeItem("user");
			localStorage.removeItem("token");
			return {
				...state,
				user: null,
				token: null,
				isAuthenticated: false,
			};
		case "SET_USER":
			localStorage.setItem("user", JSON.stringify(action.payload));
			return {
				...state,
				user: action.payload,
			};
		default:
			return state;
	}
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
	const [auth, authDispatch] = useReducer(authReducer, initialState);
	return <AuthContext.Provider value={{ auth, authDispatch }}>{children}</AuthContext.Provider>;
};

export default AuthContext;
