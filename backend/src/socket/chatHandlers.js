import prisma from "../../prisma/client.js";
import { joinRoom } from "../services/roomService.js";

export function chatHandlers(io, socket) {
  socket.on("joinRoom", async ({ roomId, userId }) => {
    socket.join(`room-${roomId}`);
    await await joinRoom(prisma, roomId, userId);

    socket.emit("joinedRoom", { roomId });
  });

  socket.on("joinRooms", async ({ roomIds, userId }) => {
    roomIds.forEach((roomId) => {
      socket.join(`room-${roomId}`);
    });
  });

  socket.on("user-seen", async ({ roomId, userId, timestamp }) => {
    // Aktualizácia databázy cez Prisma (alebo čokoľvek iné)
    console.log(timestamp);
    await prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { lastSeen: timestamp },
      create: { userId, roomId, lastSeen: timestamp },
    });
  });

  socket.on("leaveRoom", async ({ roomId, userId }) => {
    socket.leave(`room-${roomId}`);

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
    io.to(`room-${roomId}`).emit("newMessage", {
      roomId: roomId,
      id: message.id,
      userId: message.userId,
      text: message.text,
      createdAt: message.createdAt,
      user: {
        id: message.user.id,
        email: message.user.email,
        firstName: message.user.firstName,
        lastName: message.user.lastName,
      },
    });
  });

  socket.on("disconnect", () => {});
}
