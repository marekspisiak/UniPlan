import prisma from "../../prisma/client.js";

export const protectPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Predpokladám, že používateľa máš v req.user
      const { id: eventId } = req.params; // Predpokladám, že id eventu príde v parametri URL
      const userRole = req.user.role;

      if (!eventId) {
        return res.status(400).json({ message: "Chýba event id" });
      }

      if (userRole === "ADMIN") {
        return next();
      }

      const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        include: {
          organizer: true, // ak máš organizátora ako osobitný field
          moderators: {
            where: {
              userId: userId,
            },
            select: {
              id: true,
              canEditEvent: true,
              canManageParticipants: true,
              canManageAttendees: true,
              canManageModerators: true,
              canRepostEvent: true,
            },
          },
        },
      });

      if (!event) {
        return res.status(404).json({ message: "Event nebol nájdený" });
      }

      if (event.organizerId === userId) {
        return next();
      }

      const moderator = event.moderators[0];

      if (!moderator) {
        return res.status(403).json({ message: "Nemáš oprávnenie" });
      }

      if (!moderator[permissionKey]) {
        return res.status(403).json({ message: "Nemáš oprávnenie" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Chyba servera" });
    }
  };
};
