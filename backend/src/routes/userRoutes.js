import express from "express";
import { protect, protectVerified } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserInterests,
  updateProfilePhoto,
} from "../controllers/userController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  const { id, firstName, lastName, email, requiresVerification } = req.user;
  res
    .status(200)
    .json({ id, firstName, lastName, email, requiresVerification });
});

router.get("/:id", protectVerified, getUserProfile);
router.put("/me/interests", protectVerified, updateUserInterests);
router.post(
  "/upload-photo",
  protectVerified,
  upload.single("photo"),
  updateProfilePhoto
);

export default router;
