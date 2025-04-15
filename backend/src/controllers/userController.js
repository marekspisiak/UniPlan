import prisma from "../../prisma/client.js";
import {
  createAndSendVerificationEmail,
  needsReverification,
} from "../utils/verificationHelpers.js";

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

    res.json(user);
  } catch (err) {
    console.error("Chyba pri načítaní profilu:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const updateUserInterests = async (req, res) => {
  const userId = req.user.id;
  const { categoryIds } = req.body; // očakávame pole ID kategórií

  if (!Array.isArray(categoryIds)) {
    return res.status(400).json({ message: "Neplatné údaje." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        interests: {
          set: [], // vymažeme všetky
          connect: categoryIds.map((id) => ({ id })),
        },
      },
      include: {
        interests: true,
      },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Chyba pri aktualizácii záujmov:", err);
    res.status(500).json({ message: "Server error." });
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
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { firstName, lastName, email, interests } = req.body;
  console.log(firstName);

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
    console.error("Chyba pri úprave profilu:", err);
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
      profileImageUrl: `http://localhost:5000/uploads/profile/user_${user.id}.png`,
    }));

    res.json(usersWithImage);
  } catch (err) {
    console.error("Chyba pri vyhľadávaní používateľov:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};
