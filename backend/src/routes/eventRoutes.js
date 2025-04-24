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
router.post("/:id/attend", protectVerified, attendEventDays);

router.put("/:id/edit-details", protectVerified, eventUpload, editEvent);

router.put("/:id/edit-moderators", protectVerified, updateEventModerators);
router.delete(
  "/:id/attendance/recurring/:eventDayId/:userId",
  protectVerified,
  deleteRecurringAttendance
);
router.delete(
  "/:id/attendance/single/:occurrenceId/:userId",
  protectVerified,
  deleteSingleAttendance
);
router.get("/:id", protectVerified, getEventByDate);

export default router;
