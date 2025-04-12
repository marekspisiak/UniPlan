import express from "express";
import { createEvent } from "../controllers/eventController.js";
import { protectVerified } from "../middleware/authMiddleware.js";
import { getEventCategories } from "../controllers/eventController.js";

const router = express.Router();

router.post("/create", protectVerified, createEvent);
router.get("/categories", protectVerified, getEventCategories);

export default router;
