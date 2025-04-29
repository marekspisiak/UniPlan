// utils/createAndSendVerificationEmail.js
import { generateVerificationToken } from "./generateToken.js";
import { sendVerificationEmail } from "./sendEmail.js";
import prisma from "../../prisma/client.js";
import jwt from "jsonwebtoken";

export const createAndSendVerificationEmail = async (
  userId,
  userEmail,
  lastVerifiedAt = null
) => {
  const token = generateVerificationToken();
  const isReminder = !!lastVerifiedAt; // true ak je opätovné overenie

  await prisma.emailVerificationToken.deleteMany({
    where: { userId },
  });

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
    },
  });

  await sendVerificationEmail(userEmail, token, isReminder);
};

export const needsReverificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (needsReverification(decoded)) {
      return false;
    } else {
      return decoded;
    }
  } catch {
    return false;
  }
};

// 📅 Kontrola, či je potrebné opätovné overenie
export const needsReverification = ({ lastVerifiedAt }) => {
  if (!lastVerifiedAt) return true;

  const now = new Date();
  const year = now.getFullYear();

  // Semestre začínajú:
  const winterStart = new Date(`${year}-02-01T00:00:00`);
  const summerStart = new Date(`${year}-07-01T00:00:00`);

  let semesterStart;

  if (now < summerStart) {
    semesterStart = winterStart;
  } else {
    semesterStart = summerStart;
  }

  return new Date(lastVerifiedAt) < semesterStart;
};
