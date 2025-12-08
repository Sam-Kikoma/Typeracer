import * as dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "3002";
export const ENGINE_URL = process.env.ENGINE_URL || "http://localhost:3003";
