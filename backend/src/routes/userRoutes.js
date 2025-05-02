import express from "express";
import { protect, protectVerified } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserInterests,
  updateProfile,
  searchUsers,
  changePassword,
} from "../controllers/userController.js";
import { uploadUserPicture } from "../middleware/uploadUserPicture.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  const {
    id,
    firstName,
    lastName,
    email,
    requiresVerification,
    profileImageUrl,
    interests,
    role,
  } = req.user;
  res.status(200).json({
    interests,
    id,
    firstName,
    lastName,
    email,
    requiresVerification,
    profileImageUrl,
    role,
  });
});

router.put("/me/interests", protectVerified, updateUserInterests);
router.put("/profile", protectVerified, uploadUserPicture, updateProfile);
router.get("/search", protectVerified, searchUsers);
router.put("/change-password", protectVerified, changePassword);
router.get("/:id", protectVerified, getUserProfile);

export default router;
