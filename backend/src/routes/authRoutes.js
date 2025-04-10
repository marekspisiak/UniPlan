import express from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail); // nový endpoint

router.get("/me", protect, (req, res) => {
  const { id, firstName, lastName, email } = req.user;
  res.status(200).json({ id, firstName, lastName, email });
});

export default router;
