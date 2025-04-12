import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.js";
import {
  createAndSendVerificationEmail,
  needsReverification,
} from "../utils/verificationHelpers.js";

// 🧑‍🎓 Registrácia používateľa
export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!email.endsWith("uniza.sk")) {
      return res
        .status(400)
        .json({ message: "Použi školský email končiaci na @uniza.sk." });
    }

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

    await createAndSendVerificationEmail(user.id, user.email);

    res.status(201).json({
      message:
        "Registrácia prebehla úspešne. Skontroluj si email pre overenie účtu.",
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ message: "Server error pri overovaní emailu" });
  }
};

// 🔐 Login
export const loginUser = async (req, res) => {
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

    const token = generateJwt(user.id);

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
    console.error(err);
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
    console.error("Chyba pri odosielaní overovacieho emailu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

// 🔐 Pomocná funkcia na generovanie JWT
const generateJwt = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};
