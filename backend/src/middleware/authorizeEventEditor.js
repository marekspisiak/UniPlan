import prisma from "../../prisma/client.js";

export const authorizeEventEditor = async (req, res, next) => {
  const userId = req.user?.id;
  const eventId = parseInt(req.params.id);

  if (!userId || isNaN(eventId)) {
    return res.status(400).json({ message: "Neplatná požiadavka." });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        organizerId: true,
        moderators: { select: { id: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    const isOrganizer = event.organizerId === userId;
    const isModerator = event.moderators.some((mod) => mod.id === userId);

    if (!isOrganizer && !isModerator) {
      return res
        .status(403)
        .json({ message: "Nemáš oprávnenie upraviť tento event." });
    }

    next();
  } catch (error) {
    console.error("Chyba pri autorizácii editora:", error);
    res.status(500).json({ message: "Chyba servera." });
  }
};
