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

dotenv.config();
const app = express();
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

const PORT = process.env.PORT || 5000;

// 🛠️ Tu vytvoriš httpServer a napojíš sockety
const httpServer = http.createServer(app);

setupSocket(httpServer); // <- spustíš náš socket setup na server

httpServer.listen(PORT, () => {
  console.log(`API a Socket server beží na http://localhost:${PORT}`);
});
