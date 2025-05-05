import prisma from "../../prisma/client.js";

import { AppError } from "../utils/AppError.js";

import {
  getRoomMessagesParamsSchema,
  getRoomMessagesQuerySchema,
  leaveRoomParamsSchema,
  updateLastSeenParamsSchema,
} from "../validation/roomSchemas.js";

export const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id; // musíš mať middleware ktorý nastaví req.user
    const rooms = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            event: {
              include: {
                moderators: {
                  select: {
                    userId: true, // alebo include: { user: true } ak chceš celého používateľa
                  },
                },
              },
            },
            members: {
              where: {
                userId: req.user.id,
              },
              select: {
                lastSeen: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
              select: {
                text: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // Formátovanie výsledku
    let formattedRooms = rooms.map((member) => {
      const lastMessage = member.room.messages[0]?.text || null;
      const lastMessageTime = member.room.messages[0]?.createdAt || null;
      const event = member.room.event;

      const moderatorIds = event.moderators?.map((mod) => mod.userId) || [];

      return {
        id: member.roomId,
        title: member.room.title || event.title,
        mainImage: event.mainImage,
        lastSeen: member.room.members[0]?.lastSeen || null,
        lastMessage,
        lastMessageTime,
        organizerId: event.organizerId,
        moderatorIds, // pole čísel (napr. [12, 34])
      };
    });

    // 🔥 Zoradenie podľa lastMessageTime (najnovšie prvé)
    formattedRooms.sort((a, b) => {
      const timeA = a.lastMessageTime
        ? new Date(a.lastMessageTime).getTime()
        : 0;
      const timeB = b.lastMessageTime
        ? new Date(b.lastMessageTime).getTime()
        : 0;
      return timeB - timeA; // Descending: najnovšie najskôr
    });

    res.json(formattedRooms);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Nepodarilo sa načítať tvoje miestnosti." });
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const parsed = leaveRoomParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(
        "Neplatné ID miestnosti.",
        400,
        parsed.error.flatten()
      );
    }

    const { roomId } = parsed.data;
    const userId = req.user.id;

    await prisma.roomMember.deleteMany({
      where: {
        roomId,
        userId,
      },
    });

    return res.json({ message: "Opustil si miestnosť." });
  } catch (err) {
    console.warn(err);
    return next(err); // správne odovzdanie chyby
  }
};

export const getRoomMessages = async (req, res, next) => {
  try {
    const parsedParams = getRoomMessagesParamsSchema.safeParse(req.params);
    const parsedQuery = getRoomMessagesQuerySchema.safeParse(req.query);

    if (!parsedParams.success || !parsedQuery.success) {
      throw new AppError("Neplatné parametre.", 400, {
        ...(parsedParams.error && parsedParams.error.flatten()),
        ...(parsedQuery.error && parsedQuery.error.flatten()),
      });
    }

    const { roomId } = parsedParams.data;
    const { before, limit } = parsedQuery.data;

    const whereClause = {
      roomId,
      ...(before && {
        createdAt: { lt: new Date(before) },
      }),
    };

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit || 20,
    });

    return res.json(messages.reverse());
  } catch (err) {
    console.warn(err);
    return next(err);
  }
};

export const updateLastSeen = async (req, res, next) => {
  try {
    const parsed = updateLastSeenParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(
        "Neplatné ID miestnosti.",
        400,
        parsed.error.flatten()
      );
    }

    const { roomId } = parsed.data;
    const userId = req.user.id;

    await prisma.roomMember.updateMany({
      where: {
        roomId,
        userId,
      },
      data: {
        lastSeen: new Date(),
      },
    });

    return res.status(200).json({ message: "Last seen updated" });
  } catch (err) {
    console.warn(err);
    return next(err);
  }
};
