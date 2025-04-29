import { Server } from "socket.io";
import { chatHandlers } from "./chatHandlers.js";
import jwt from "jsonwebtoken";
import { needsReverificationToken } from "../utils/verificationHelpers.js";

let io;

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", async (socket) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("⚠️ Socket bez tokenu - odpojený");
      socket.disconnect();
      return;
    }

    try {
      const payload = needsReverificationToken(token); // Overíš JWT token
      if (payload) {
        chatHandlers(io, socket); // teraz až pustíš eventy
      }
    } catch (error) {
      console.log("❌ Neplatný token:", error.message);
      socket.disconnect();
    }
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
