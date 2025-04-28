import express from "express";
import { protectVerified } from "../middleware/authMiddleware.js";
import {
  getMyRooms,
  leaveRoom,
  getRoomMessages,
  updateLastSeen,
} from "../controllers/roomController..js";

const router = express.Router();

router.get("/my-rooms", protectVerified, getMyRooms);
router.delete("/:roomId/leave", protectVerified, leaveRoom);
router.get("/:roomId/messages", protectVerified, getRoomMessages);
router.post("/:roomId/seen", protectVerified, updateLastSeen);

export default router;
