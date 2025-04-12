import prisma from "../../prisma/client.js";

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      capacity,
      categoryIds, // teraz pole čísel
    } = req.body;

    if (
      !title ||
      !date ||
      !time ||
      !location ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return res.status(400).json({ message: "Vyplň všetky povinné polia." });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        time,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        organizerId: req.user.id,
        categories: {
          connect: categoryIds.map((id) => ({ id: parseInt(id) })),
        },
      },
      include: {
        categories: true,
      },
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Chyba pri vytváraní akcie:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const getEventCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" }, // zoradenie voliteľné
    });

    res.json(categories);
  } catch (err) {
    console.error("Chyba pri načítaní kategórií:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};
