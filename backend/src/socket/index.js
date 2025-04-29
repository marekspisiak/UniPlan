import { Server } from "socket.io";
import { chatHandlers } from "./chatHandlers.js"; // ✅ teraz sedí názov

let io;

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    chatHandlers(io, socket);
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
