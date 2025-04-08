import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Neautorizovaný prístup" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ message: "Používateľ neexistuje" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Neplatný token" });
  }
};
