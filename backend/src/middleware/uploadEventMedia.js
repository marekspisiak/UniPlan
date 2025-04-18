// src/middleware/uploadEventMedia.js
import multer from "multer";
import path from "path";
import fs from "fs";

const EVENT_UPLOAD_DIR = "uploads/events";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(EVENT_UPLOAD_DIR, { recursive: true });
    cb(null, EVENT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = ".png"; // vždy ukladáme ako .png (bezpečné default)
    const timestamp = Date.now();

    if (file.fieldname === "mainImage") {
      cb(null, `event_main_${timestamp}${ext}`);
    } else if (file.fieldname === "gallery") {
      const random = Math.floor(Math.random() * 100000);
      cb(null, `event_gallery_${timestamp}_${random}${ext}`);
    } else {
      cb(new Error("Nepodporované pole."), false);
    }
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Iba obrazky su povolene."), false);
  }
};

export const eventUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB na súbor
}).fields([
  { name: "mainImage", maxCount: 1 },
  { name: "gallery", maxCount: 5 },
]);
