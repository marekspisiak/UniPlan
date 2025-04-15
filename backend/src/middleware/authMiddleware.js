import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.js";
import { needsReverification } from "../utils/verificationHelpers.js";

// 🎯 Základný protect (iba overenie tokenu + user existuje)
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
      include: { interests: true }, // ak potrebuješ rovno aj záujmy
    });

    if (!user) {
      return res.status(401).json({ message: "Používateľ neexistuje" });
    }

    // Dynamicky vytvorený link na profilovú fotku
    const profileImageUrl = `http://localhost:5000/uploads/profile/user_${user.id}.png`;

    req.user = {
      ...user,
      requiresVerification: needsReverification(user),
      profileImageUrl,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Neplatný token" });
  }
};

// ✅ Rozšírený protect – vyžaduje overenie emailu
export const protectVerified = async (req, res, next) => {
  await protect(req, res, async () => {
    if (req.user.requiresVerification) {
      return res
        .status(403)
        .json({ message: "Vyžaduje sa opätovné overenie emailu" });
    }

    next();
  });
};
