import express from "express";
import { protect, protectVerified } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserInterests,
  updateProfilePhoto,
  updateProfile,
  searchUsers,
} from "../controllers/userController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  const {
    id,
    firstName,
    lastName,
    email,
    requiresVerification,
    profileImageUrl,
  } = req.user;
  res
    .status(200)
    .json({
      id,
      firstName,
      lastName,
      email,
      requiresVerification,
      profileImageUrl,
    });
});

router.put("/me/interests", protectVerified, updateUserInterests);
router.put(
  "/upload-photo",
  protectVerified,
  upload.single("photo"),
  updateProfilePhoto
);

router.put("/profile", protectVerified, upload.single("photo"), updateProfile);
router.get("/search", searchUsers);
router.get("/:id", protectVerified, getUserProfile);

export default router;
