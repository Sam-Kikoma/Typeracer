import { Router } from "express";
import { getRooms, newRoom, joinRoom, leaveRoom } from "../controllers/room.ts";
const roomRouter = Router();

roomRouter.get("/", getRooms);
// roomRouter.post("/", newRoom);
// roomRouter.post("/:roomCode/join", joinRoom);
// roomRouter.delete("/:roomId/leave", leaveRoom);

export default roomRouter;
