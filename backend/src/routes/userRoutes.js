import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  const { id, firstName, lastName, email } = req.user;
  res.status(200).json({ id, firstName, lastName, email });
});

export default router;
