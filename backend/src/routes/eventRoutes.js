import express from "express";
import { createEvent, getAllEvents } from "../controllers/eventController.js";
import { protectVerified } from "../middleware/authMiddleware.js";
import {
  getEventCategories,
  joinEvent,
  getEventById,
  leaveEvent,
  subscribeToEvent,
  unsubscribeFromEvent,
  updateEvent,
} from "../controllers/eventController.js";
import { eventUpload } from "../middleware/uploadEventMedia.js";
import { authorizeEventEditor } from "../middleware/authorizeEventEditor.js";

const router = express.Router();

router.post("/create", protectVerified, eventUpload, createEvent);
router.get("/categories", protectVerified, getEventCategories);
router.get("/get", protectVerified, getAllEvents);
router.post("/:id/join", protectVerified, joinEvent);
router.post("/:id/leave", protectVerified, leaveEvent);
router.post("/:id/subscribe", protectVerified, subscribeToEvent);
router.post("/:id/unsubscribe", protectVerified, unsubscribeFromEvent);
router.put(
  "/:id/edit",
  protectVerified,
  authorizeEventEditor,
  eventUpload,
  updateEvent // napríklad tá funkcia čo si predtým robil
);
router.get("/:id", protectVerified, getEventById);

export default router;
