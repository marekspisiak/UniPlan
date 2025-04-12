// utils/createAndSendVerificationEmail.js
import { generateVerificationToken } from "./generateToken.js";
import { sendVerificationEmail } from "./sendEmail.js";
import prisma from "../../prisma/client.js";

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

// 📅 Kontrola, či je potrebné opätovné overenie
export const needsReverification = (user) => {
  if (!user.lastVerifiedAt) return true;

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

  return new Date(user.lastVerifiedAt) < semesterStart;
};
