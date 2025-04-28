import prisma from "../../prisma/client.js";

export const protectPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id; // Predpokladám, že používateľa máš v req.user
      const { id: eventId } = req.params; // Predpokladám, že id eventu príde v parametri URL
      const userRole = req.user.role;

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // 👉 Ak je ADMIN, pustíme ho bez ďalšej kontroly
      if (userRole === "ADMIN") {
        return next();
      }

      // Načítame event vrátane organizátora a moderátorov
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
        return res.status(404).json({ message: "Event not found" });
      }

      // 1. Je organizátor?
      if (event.organizerId === userId) {
        return next(); // Organizátor má všetky práva
      }

      // 2. Je moderátor?
      const moderator = event.moderators[0]; // Ak existuje moderátor pre tohto usera

      if (!moderator) {
        return res
          .status(403)
          .json({ message: "You are not authorized to perform this action" });
      }

      // 3. Má požadované právo?
      if (!moderator[permissionKey]) {
        return res
          .status(403)
          .json({ message: "You do not have permission for this action" });
      }

      // Všetko OK
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
