import prisma from "../../prisma/client.js";
import { toArray } from "../utils/helpers.js";
import {
  createAndSendVerificationEmail,
  needsReverification,
} from "../utils/verificationHelpers.js";
import bcrypt from "bcrypt";

export const getUserProfile = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        lastVerifiedAt: true,
        interests: {
          select: {
            id: true,
            name: true,
            label: true,
            icon: true,
          },
        },
      },
    });

    if (!user)
      return res.status(404).json({ message: "Používateľ neexistuje." });

    const userWithImage = {
      ...user,
      profileImageUrl: `http://localhost:5000/uploads/profile/user_${user.id}.png`,
    };

    res.json(userWithImage);
  } catch (err) {
    res.status(500).json({ message: "Chyba pri načítaní profilu." });
  }
};

export const updateUserInterests = async (req, res) => {
  const userId = req.user.id;
  const categoryIds = toArray(req.body.categoryIds);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        interests: {
          set: [], // vymažeme všetky
          connect: categoryIds.map((id) => ({ id })),
        },
      },
    });

    return res.json({ message: "Úspešne editované" });
  } catch (err) {
    res.status(500).json({ message: "Chyba pri aktualizácii záujmov." });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Žiadny obrázok nebol nahraný." });
    }

    const imageUrl = `/uploads/profile/${req.file.filename}`;

    res.json({ message: "Profilová fotka bola aktualizovaná.", imageUrl });
  } catch (err) {
    console.error("Chyba pri aktualizácii profilovej fotky:", err);
    res
      .status(500)
      .json({ message: "Chyba pri aktualizácii profilovej fotky" });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email } = req.body;
  const interests = toArray(req.body.interests);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "Používateľ neexistuje." });
    }

    const updates = {
      firstName,
      lastName,
    };

    // 📧 Ak sa mení email
    let reverify = false;
    if (email && email !== user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Tento email už používa iný účet." });
      }

      updates.email = email;
      updates.lastVerifiedAt = null;
      reverify = true;
    }

    // ✅ Záujmy – aktualizácia vzťahu M:N
    if (Array.isArray(interests)) {
      updates.interests = {
        set: interests.map((id) => ({ id: parseInt(id) })),
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // ✉️ Ak sa zmenil email – pošli overenie
    if (reverify) {
      await createAndSendVerificationEmail(userId, email);
      return res.json({
        message: "Email bol zmenený. Musíš ho znova overiť.",
        reverify: true,
      });
    }

    return res.json({ message: "Profil bol úspešne aktualizovaný." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Chyba servera pri úprave profilu." });
  }
};

export const searchUsers = async (req, res) => {
  const query = req.query.q;

  if (!query || query.length < 3) {
    return res
      .status(400)
      .json({ message: "Zadaj aspoň 3 znaky na vyhľadávanie." });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        lastVerifiedAt: true,
        createdAt: true,
      },
    });

    // ⚠️ Filtrovanie až v JS, pretože needsReverification nie je Prisma funkcia
    const verifiedUsers = users.filter((user) => !needsReverification(user));

    const usersWithImage = verifiedUsers.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImageUrl: `/uploads/profile/user_${user.id}.png`,
    }));

    res.json(usersWithImage);
  } catch (err) {
    res.status(500).json({ message: "Chyba pri vyhľadávaní používateľov" });
  }
};

// controllers/user/changePassword.js

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // <- ID z tokenu, predpokladám že protect middleware to tam dá
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Prosím, vyplň všetky polia." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return res.status(400).json({ message: "Používateľ nenájdený." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Nesprávne aktuálne heslo." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return res.status(200).json({ message: "Heslo bolo úspešne zmenené." });
  } catch (err) {
    return res.status(500).json({ message: "Nastala chyba pri zmene hesla." });
  }
};
