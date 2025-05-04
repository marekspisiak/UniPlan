import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import dayRoutes from "./routes/dayRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

import { setupSocket } from "./socket/index.js"; // <- máme setupSocket správne

import path from "path";
import { fileURLToPath } from "url";
import http from "http"; // <- pridáš toto (core Node modul)
import { getCurrentUTCDate } from "./utils/dateHelpers.js";
import "./cron/dailyTasks.js";
import { responseLogger } from "./utils/logs.js";
import { AppError } from "./utils/AppError.js";

dotenv.config();
const app = express();
//app.use(responseLogger);
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/days", dayRoutes);
app.use("/api/rooms", roomRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error("Neošetrená chyba:", err);
  return res.status(500).json({ message: "Vnútorná chyba servera." });
});

const PORT = process.env.PORT || 5000;

// 🛠️ Tu vytvoriš httpServer a napojíš sockety
const httpServer = http.createServer(app);

setupSocket(httpServer); // <- spustíš náš socket setup na server

httpServer.listen(PORT, () => {
  console.log(`API a Socket server beží na http://localhost:${PORT}`);
});
