import express from "express";
import { createEvent, getAllEvents } from "../controllers/eventController.js";
import { protectVerified } from "../middleware/authMiddleware.js";
import {
  getEventCategories,
  joinEvent,
  getEventByDate,
  leaveEvent,
  updateEventModerators,
  editEvent,
  attendEventDays,
  deleteRecurringAttendance,
  deleteSingleAttendance,
  deleteEvent,
} from "../controllers/eventController.js";
import { uploadEventMedia } from "../middleware/uploadEventMedia.js";
import { authorizeEventEditor } from "../middleware/authorizeEventEditor.js";
import { protectPermission } from "../middleware/permissions.js";

const router = express.Router();

router.post("/create", protectVerified, uploadEventMedia, createEvent);
router.get("/categories", protectVerified, getEventCategories);
router.get("/get", protectVerified, getAllEvents);
router.post("/:id/join", protectVerified, joinEvent);
router.post("/:id/leave", protectVerified, leaveEvent);
router.post("/:id/attend", protectVerified, attendEventDays);

router.put(
  "/:id/edit-details",
  protectVerified,
  protectPermission("canEditEvent"),
  uploadEventMedia,
  editEvent
);

router.delete(
  "/:id",
  protectVerified,
  protectPermission("isOrganizer"),
  deleteEvent
);

router.put(
  "/:id/edit-moderators",
  protectVerified,
  protectPermission("canManageModerators"),
  updateEventModerators
);
router.delete(
  "/:id/attendance/recurring/:eventDayId/:userId",
  protectVerified,
  protectPermission("canManageAttendees"),

  deleteRecurringAttendance
);
router.delete(
  "/:id/attendance/single/:occurrenceId/:userId",
  protectVerified,
  protectPermission("canManageParticipants"),
  deleteSingleAttendance
);
router.get("/:id", protectVerified, getEventByDate);

export default router;
