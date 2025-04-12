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

  // Vytvoríme dve hranice
  const winterDeadline = new Date(`${year}-01-31T23:59:59`);
  const summerDeadline = new Date(`${year}-06-30T23:59:59`);

  let currentDeadline;

  if (now <= winterDeadline) {
    currentDeadline = winterDeadline;
  } else if (now <= summerDeadline) {
    currentDeadline = summerDeadline;
  } else {
    // Ak sme po 30. júni, ďalšie overenie bude do konca januára budúceho roka
    currentDeadline = new Date(`${year + 1}-01-31T23:59:59`);
  }

  return user.lastVerifiedAt < currentDeadline;
};
