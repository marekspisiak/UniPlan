import express from "express";
import {
  registerUser,
  verifyEmail,
  loginUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail); // nový endpoint

export default router;
