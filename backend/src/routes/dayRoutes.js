import express from "express";
import { getAllDays } from "../controllers/dayController.js";

const router = express.Router();

router.get("/", getAllDays);

export default router;
