import bcrypt from "bcrypt";
import prisma from "../../prisma/client.js";
import { generateVerificationToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!email.endsWith("@uniza.sk")) {
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
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hodina

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await sendVerificationEmail(user.email, token);

    res.status(201).json({
      message:
        "Registrácia prebehla úspešne. Skontroluj si email pre overenie účtu.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({ message: "Chýba token" });
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      return res
        .status(400)
        .json({ message: "Token je neplatný alebo už bol použitý" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Token expiroval" });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await prisma.emailVerificationToken.delete({
      where: { token },
    });

    return res.status(200).json({
      message: "Email bol úspešne overený. Teraz sa môžeš prihlásiť.",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error pri overovaní emailu" });
  }
};

const generateJwt = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Nesprávny email alebo heslo." });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Musíš najskôr overiť svoju emailovú adresu." });
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
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error pri prihlasovaní." });
  }
};
