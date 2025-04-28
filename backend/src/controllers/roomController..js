import prisma from "../../prisma/client.js";

export const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id; // musíš mať middleware ktorý nastaví req.user

    const rooms = await prisma.roomMember.findMany({
      where: { userId },
      include: {
        room: {
          include: {
            event: true,
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
              take: 1, // posledná správa
              select: {
                text: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const formattedRooms = rooms.map((member) => {
      const lastMessage = member.room.messages[0]?.text || null;
      const lastMessageTime = member.room.messages[0]?.createdAt || null;

      return {
        id: member.roomId,
        title: member.room.title || member.room.event.title,
        mainImage: member.room.event.mainImage,
        lastSeen: member.room.members[0]?.lastSeen || null,
        lastMessage,
        lastMessageTime,
      };
    });

    res.json(formattedRooms);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Nepodarilo sa načítať tvoje miestnosti." });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await prisma.roomMember.deleteMany({
      where: {
        roomId: parseInt(roomId),
        userId: userId,
      },
    });

    res.json({ message: "Opustil si miestnosť." });
  } catch (err) {
    console.error("Chyba pri odchode z miestnosti:", err);
    res.status(500).json({ message: "Nepodarilo sa opustiť miestnosť." });
  }
};

export const getRoomMessages = async (req, res) => {
  const { roomId } = req.params;
  const { before, limit } = req.query; // pridáme query parametre

  try {
    const whereClause = {
      roomId: parseInt(roomId),
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before), // menej ako before timestamp
      };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: true, // aj údaje o používateľovi
      },
      orderBy: { createdAt: "desc" }, // najnovšie prvé
      take: parseInt(limit) || 20, // štandardne 20
    });

    // frontend čaká správy od najstaršej po najnovšiu, preto ich prevrátime späť
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Chyba pri načítaní správ." });
  }
};

export const updateLastSeen = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  try {
    await prisma.roomMember.updateMany({
      where: {
        roomId: parseInt(roomId),
        userId: userId,
      },
      data: {
        lastSeen: new Date(),
      },
    });

    res.status(200).json({ message: "Last seen updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Chyba pri aktualizácii lastSeen" });
  }
};
