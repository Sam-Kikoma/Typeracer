import * as dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT;
export const JWTSECRET = process.env.JWT_SECRET!;
