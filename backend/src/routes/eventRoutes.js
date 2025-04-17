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
  updateEventModerators,
  updateEventDetails,
} from "../controllers/eventController.js";
import { eventUpload } from "../middleware/uploadEventMedia.js";
import { authorizeEventEditor } from "../middleware/authorizeEventEditor.js";
import { protectPermission } from "../middleware/permissions.js";

const router = express.Router();

router.post("/create", protectVerified, eventUpload, createEvent);
router.get("/categories", protectVerified, getEventCategories);
router.get("/get", protectVerified, getAllEvents);
router.post("/:id/join", protectVerified, joinEvent);
router.post("/:id/leave", protectVerified, leaveEvent);
router.post("/:id/subscribe", protectVerified, subscribeToEvent);
router.post("/:id/unsubscribe", protectVerified, unsubscribeFromEvent);

router.put(
  "/:id/edit-details",
  protectVerified,
  protectPermission("canEditEvent"),
  eventUpload,
  updateEventDetails
);

router.put(
  "/:id/edit-moderators",
  protectVerified,
  protectPermission("canManageModerators"),
  updateEventModerators
);
router.get("/:id", protectVerified, getEventById);

export default router;
