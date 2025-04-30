import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.js";
import {
  createAndSendVerificationEmail,
  needsReverification,
} from "../utils/verificationHelpers.js";

import path from "path";
import fs from "fs";

import { loginSchema, RegisterSchema } from "../validation/authSchemas.js";

export const registerUser = async (req, res) => {
  const result = RegisterSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Neplatné údaje",
      errors: result.error.errors,
    });
  }

  const { firstName, lastName, email, password } = result.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email už existuje" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    // Pridelenie default avataru
    const filename = `user_${user.id}.png`;
    const destinationPath = path.join("uploads", "profile", filename);
    const defaultImagePath = path.join("assets", "default-avatar.png");
    fs.copyFileSync(defaultImagePath, destinationPath);

    await createAndSendVerificationEmail(user.id, user.email);

    res.status(201).json({
      message:
        "Registrácia prebehla úspešne. Skontroluj si email pre overenie účtu.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Overenie emailu z tokenu
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({ message: "Chýba token" });
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record || record.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "Token je neplatný alebo už bol použitý" });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { lastVerifiedAt: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { token },
    });

    res.status(200).json({
      message: "Email bol úspešne overený. Teraz sa môžeš prihlásiť.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error pri overovaní emailu" });
  }
};

// 🔐 Login
export const loginUser = async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Neplatné údaje",
      errors: result.error.errors,
    });
  }
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Nesprávny email alebo heslo." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Nesprávny email alebo heslo." });
    }

    const token = generateJwt(user.id, user.lastVerifiedAt);

    return res.status(200).json({
      message: "Prihlásenie úspešné.",
      token,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        lastVerifiedAt: user.lastVerifiedAt, // ✅ len dátum
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error pri prihlasovaní." });
  }
};

// 🔁 Opätovné odoslanie overovacieho emailu
export const resendVerificationEmail = async (req, res) => {
  try {
    const user = req.user;

    if (!needsReverification(user)) {
      return res.status(400).json({ message: "Email je už overený." });
    }

    await createAndSendVerificationEmail(
      user.id,
      user.email,
      user.lastVerifiedAt
    );

    res.json({ message: "Overovací email bol znovu odoslaný." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Chyba pri odosielaní overovacieho emailu." });
  }
};

// 🔐 Pomocná funkcia na generovanie JWT
const generateJwt = (userId, lastVerifiedAt) => {
  return jwt.sign({ userId, lastVerifiedAt }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
