import express from "express";
import { createEvent, getAllEvents } from "../controllers/eventController.js";
import { protectVerified } from "../middleware/authMiddleware.js";
import {
  getEventCategories,
  joinEvent,
  getEventById,
  leaveEvent,
} from "../controllers/eventController.js";
import { eventUpload } from "../middleware/uploadEventMedia.js";

const router = express.Router();

router.post("/create", protectVerified, eventUpload, createEvent);
router.get("/categories", protectVerified, getEventCategories);
router.get("/get", protectVerified, getAllEvents);
router.post("/:id/join", protectVerified, joinEvent);
router.get("/:id", protectVerified, getEventById);
router.post("/:id/leave", protectVerified, leaveEvent);

export default router;
