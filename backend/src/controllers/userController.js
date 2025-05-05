import prisma from "../../prisma/client.js";
import { toArray } from "../utils/helpers.js";
import {
  createAndSendVerificationEmail,
  needsReverification,
} from "../utils/verificationHelpers.js";
import bcrypt from "bcrypt";

import fs from "fs/promises";
import path from "path";

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
        profileImageUrl: true,

        createdAt: true,
        lastVerifiedAt: true,
        profileImageUrl: true,
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

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Chyba pri načítaní profilu." });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email, mainImageChanged } = req.body;
  const interests = toArray(req.body.interests);

  let newImagePath = null;
  let oldImagePathToDelete = null;
  console.log(req.body);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "Používateľ neexistuje." });
    }

    const updates = {
      firstName,
      lastName,
    };

    // 📸 Spracovanie profilového obrázka
    if (mainImageChanged === "true" || mainImageChanged === true) {
      if (req.file) {
        const normalizedPath = req.file.path.replace(/\\/g, "/");
        newImagePath = "/" + normalizedPath;
        updates.profileImageUrl = newImagePath;
      } else {
        updates.profileImageUrl = null;
      }

      // Ak mal používateľ predtým obrázok, označíme ho na zmazanie
      if (user.profileImageUrl) {
        oldImagePathToDelete = path.join(".", user.profileImageUrl);
      }
    }

    // 📧 Zmena emailu
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

    // ✅ Záujmy
    if (Array.isArray(interests)) {
      updates.interests = {
        set: interests.map((id) => ({ id: parseInt(id) })),
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: updates,
      });

      if (reverify) {
        await createAndSendVerificationEmail(tx, userId, email);
        return res.json({
          message: "Email bol zmenený. Musíš ho znova overiť.",
          reverify: true,
        });
      }
    });

    // 🗑️ Odstránenie starého obrázka, ak treba
    console.log(oldImagePathToDelete);
    if (oldImagePathToDelete) {
      fs.unlink(oldImagePathToDelete).catch((err) => {
        console.warn("⚠️ Nepodarilo sa zmazať starý obrázok:", err.message);
      });
    }

    return res.json({ message: "Profil bol aktualizovaný." });
  } catch (err) {
    console.log(err);
    // Ak sa niečo pokazilo, odstráň nový nahratý obrázok
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.warn(
          "⚠️ Nepodarilo sa zmazať nový obrázok po chybe:",
          e.message
        );
      }
    }

    return res
      .status(500)
      .json({ message: "Chyba pri aktualizácii profilu.", error: err.message });
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
        profileImageUrl: true,
      },
    });

    // ⚠️ Filtrovanie až v JS, pretože needsReverification nie je Prisma funkcia
    const verifiedUsers = users.filter((user) => !needsReverification(user));

    res.json(verifiedUsers);
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
