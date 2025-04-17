import prisma from "../../prisma/client.js";

export const protectPermission = (permissionKey) => {
  return async (req, res, next) => {
    const userId = req.user?.id;
    const eventId = parseInt(req.params.id);

    if (!userId || isNaN(eventId)) {
      return res.status(400).json({ message: "Neplatné údaje." });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
        series: {
          include: {
            moderators: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    if (event.organizerId === userId) {
      return next(); // organizátor má všetky práva
    }

    const mod = event.series.moderators.find((m) => m.userId === userId);
    if (mod && mod[permissionKey]) {
      return next(); // má danú pravomoc
    }

    return res.status(403).json({ message: "Nemáš oprávnenie na túto akciu." });
  };
};
