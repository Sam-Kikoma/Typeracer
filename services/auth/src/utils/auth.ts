import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWTSECRET } from "./config.ts";
export const hashPassword = (password: string) => {
	return bcrypt.hash(password, 5);
};

export const comparePassword = (password: string, hash: string) => {
	return bcrypt.compare(password, hash);
};

export const jwtGen = (user: { id: number; username: string }) => {
	const token = jwt.sign({ id: user.id, username: user.username }, JWTSECRET);
	return token;
};
