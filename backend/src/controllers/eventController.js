import e from "express";
import prisma from "../../prisma/client.js";

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      capacity,
      categoryIds,
      moderators,
    } = req.body;
    console.log(moderators);

    !Array.isArray(categoryIds) ? console.log("Názov akcie je prázdny") : null;

    // Validácia
    if (
      !title ||
      !date ||
      !startTime ||
      !location ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return res.status(400).json({ message: "Vyplň všetky povinné polia." });
    }

    // 💾 Spracovanie fotiek
    let mainImageUrl = null;
    let galleryUrls = [];

    if (req.files?.mainImage?.[0]) {
      mainImageUrl = `/uploads/events/${req.files.mainImage[0].filename}`;
    }

    if (req.files?.gallery?.length) {
      galleryUrls = req.files.gallery.map(
        (file) => `/uploads/events/${file.filename}`
      );
    }

    // Vytvorenie eventu

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        time: startTime,
        endTime: endTime || null,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        mainImage: mainImageUrl,
        gallery: galleryUrls.length
          ? {
              create: galleryUrls.map((url) => ({ url })),
            }
          : undefined,
        organizer: {
          connect: { id: req.user.id }, // 👈 TOTO je kľúčové
        },
        categories: {
          connect: categoryIds.map((id) => ({ id: parseInt(id) })),
        },
        moderators: moderators
          ? {
              connect: moderators.map((id) => ({ id: parseInt(id) })),
            }
          : undefined,
      },
      include: {
        categories: true,
        moderators: true,
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

// GET /api/events
export const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        categories: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        moderators: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json(events);
  } catch (err) {
    console.error("Chyba pri načítaní eventov:", err);
    res.status(500).json({ message: "Chyba pri načítaní eventov." });
  }
};
