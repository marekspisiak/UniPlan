import prisma from "../../prisma/client.js";
import { joinRoom } from "../services/roomService.js";

export function chatHandlers(io, socket) {
  socket.on("joinRoom", async ({ roomId, userId }) => {
    socket.join(`room-${roomId}`);
    await await joinRoom(prisma, roomId, userId);

    socket.emit("joinedRoom", { roomId });
  });

  socket.on("user-seen", async ({ roomId, userId, timestamp }) => {
    console.log(`User ${userId} seen room ${roomId} at ${timestamp}`);

    // Aktualizácia databázy cez Prisma (alebo čokoľvek iné)
    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { lastSeen: timestamp },
      create: { userId, roomId, lastSeen: timestamp },
    });
  });

  socket.on("leaveRoom", async ({ roomId, userId }) => {
    socket.leave(`room-${roomId}`);
    console.log(`User ${userId} left room-${roomId}`);

    socket.emit("leftRoom", { roomId });
  });

  socket.on("sendMessage", async ({ roomId, userId, text }) => {
    const message = await prisma.message.create({
      data: {
        roomId,
        userId,
        text,
      },
      include: {
        user: true,
      },
    });

    // 📢 Pošli správu všetkým v roomke
    io.to(`room-${roomId}`).emit("newMessage", {
      roomId: roomId,
      id: message.id,
      userId: message.userId,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        id: message.user.id,
        email: message.user.email,
        firstName: message.user.firstName, // ➡️ doplníme aj meno a priezvisko
        lastName: message.user.lastName,
      },
    });

    // 📢 Ale NOTIFIKÁCIU pošleme všetkým ostatným (okrem odosielateľa)
    socket.broadcast.to(`room-${roomId}`).emit("newMessageNotification", {
      roomId,
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
}
