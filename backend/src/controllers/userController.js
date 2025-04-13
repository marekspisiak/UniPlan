import prisma from "../../prisma/client.js";

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
