import express from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
  resendVerificationEmail,
} from "../controllers/authController.js";
import { protect, protectVerified } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendVerificationEmail); // nový endpoint

export default router;
