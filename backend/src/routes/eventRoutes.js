import express from "express";
import { createEvent, getAllEvents } from "../controllers/eventController.js";
import { protectVerified } from "../middleware/authMiddleware.js";
import { getEventCategories } from "../controllers/eventController.js";
import { eventUpload } from "../middleware/uploadEventMedia.js";

const router = express.Router();

router.post("/create", protectVerified, eventUpload, createEvent);
router.get("/categories", protectVerified, getEventCategories);
router.get("/get", protectVerified, getAllEvents);

export default router;
