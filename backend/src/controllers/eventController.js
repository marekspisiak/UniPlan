import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import fs from "fs"; // a ak ešte nemáš, aj fs budeš potrebovať

const toArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

export const createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, capacity } =
      req.body;
    const categoryIds = toArray(req.body.categoryIds);
    const moderators = toArray(req.body.moderators);

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
        gallery: true,
        participants: true,
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

export const joinEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: { select: { id: true } },
      },
    });
    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    // 🔒 Check: Event už skončil?
    const eventDateTimeString = `${event.date.toISOString().split("T")[0]}T${
      event.endTime || event.time
    }`;
    const eventEndDateTime = new Date(eventDateTimeString);
    const now = new Date();

    if (eventEndDateTime < now) {
      return res.status(400).json({ message: "Tento event už prebehol." });
    }

    // ✅ Už je prihlásený?
    const alreadyJoined = event.participants.some((p) => p.id === userId);
    if (alreadyJoined) {
      return res
        .status(400)
        .json({ message: "Už si prihlásený na tento event." });
    }

    // 🚫 Kapacita plná?
    if (event.capacity && event.participants.length >= event.capacity) {
      return res.status(400).json({ message: "Kapacita eventu je plná." });
    }
    console.log("joinEvent called");

    // 🎉 Prihlásenie
    await prisma.event.update({
      where: { id: eventId },
      data: {
        participants: {
          connect: { id: userId },
        },
      },
    });

    res.json({ message: "Úspešne si sa prihlásil na event." });
  } catch (err) {
    console.error("Chyba pri prihlasovaní na event:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const getEventById = async (req, res) => {
  const eventId = parseInt(req.params.id);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: "Neplatné ID eventu." });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        categories: true,
        gallery: true,
        participants: true,
        subscribers: true,
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
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subscribers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    // Pridanie URL k profilovkám
    const addProfileUrl = (user) => ({
      ...user,
      profileImageUrl: `http://localhost:5000/uploads/profile/user_${user.id}.png`,
    });

    res.json({
      ...event,
      organizer: addProfileUrl(event.organizer),
      moderators: event.moderators.map(addProfileUrl),
      participants: event.participants.map(addProfileUrl),
    });
  } catch (err) {
    console.error("Chyba pri načítaní eventu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const leaveEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = parseInt(req.params.id);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: true },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    const isParticipant = event.participants.some((p) => p.id === userId);
    if (!isParticipant) {
      return res
        .status(400)
        .json({ message: "Nie si prihlásený na tento event." });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        participants: {
          disconnect: { id: userId },
        },
      },
    });

    res.json({ message: "Úspešne si sa odhlásil z eventu." });
  } catch (err) {
    console.error("Chyba pri odhlasovaní:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const subscribeToEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = parseInt(req.params.id);

  try {
    // Najprv načítaj event aj s počtom subscriberov
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        subscribers: true,
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    if (event.capacity && event.subscribers.length >= event.capacity) {
      return res
        .status(400)
        .json({ message: "Kapacita odberateľov tohto eventu je plná." });
    }

    // Pridaj subscribera (ak ešte nie je pridaný)
    await prisma.event.update({
      where: { id: eventId },
      data: {
        subscribers: {
          connect: { id: userId },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Úspešne si sa prihlásil na odber eventu." });
  } catch (err) {
    console.error("Chyba pri subscribnutí:", err);
    res.status(500).json({ message: "Chyba servera pri subscribnutí." });
  }
};

export const unsubscribeFromEvent = async (req, res) => {
  const userId = req.user.id;
  const eventId = parseInt(req.params.id);

  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        subscribers: {
          disconnect: { id: userId },
        },
      },
    });

    res.status(200).json({ message: "Odhlásený z odberu eventu." });
  } catch (err) {
    console.error("Chyba pri odhlasovaní z odberu:", err);
    res.status(500).json({ message: "Chyba servera pri odhlasovaní." });
  }
};

export const updateEvent = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const {
    title,
    description,
    date,
    time,
    endTime,
    location,
    capacity,
    mainImage,

    mainImageChanged,
  } = req.body;

  const categoryIds = toArray(req.body.categoryIds);
  const moderators = toArray(req.body.moderators);
  const deletedGallery = toArray(req.body.deletedGallery);

  console.log(req.body);
  console.log(mainImage);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { gallery: true },
    });

    if (!event) return res.status(404).json({ message: "Event nenájdený." });

    // Remove old gallery images if requested
    if (deletedGallery.length > 0) {
      // Relatívne cesty s / pre porovnanie v DB
      const relativePaths = deletedGallery.map((fullUrl) =>
        new URL(fullUrl).pathname.replace(/^\/*/, "/")
      );

      // Odstrániť z DB
      await prisma.eventImage.deleteMany({
        where: {
          url: { in: relativePaths },
        },
      });

      // Odstrániť zo súborového systému
      relativePaths.forEach((urlPath) => {
        const pathWithoutLeadingSlash = urlPath.replace(/^\/+/, ""); // napr. 'uploads/events/xyz.png'
        const filePath = path.join(pathWithoutLeadingSlash);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Handle new uploaded images
    const newGalleryImages = req.files?.gallery || [];
    const galleryData = newGalleryImages.map((file) => ({
      url: "/uploads/events/" + file.filename,
      eventId: event.id,
    }));
    await prisma.eventImage.createMany({ data: galleryData });

    // Main image handling
    let mainImageUrl = event.mainImage || null;

    if (mainImageChanged === "true") {
      // Ak existovala stará fotka, zmažeme ju zo systému
      if (event.mainImage) {
        const oldRelativePath = event.mainImage.replace(/^\/+/, ""); // odstráni leading slash
        const oldPath = path.join("uploads", oldRelativePath); // zloží cestu

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Ak je nahratá nová fotka → nastavíme novú cestu
      console.log("mainImageChanged === true");
      console.log(req.files);
      if (req.files?.mainImage?.[0]) {
        mainImageUrl = "/uploads/events/" + req.files.mainImage[0].filename;
      } else {
        // Ak nie je nahratá žiadna → vymažeme aj z DB
        mainImageUrl = null;
      }
    }
    console.log(moderators);

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        date: new Date(date),
        time,
        endTime: endTime || null,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        mainImage: mainImageUrl,
        categories: {
          set: categoryIds.map((id) => ({ id: parseInt(id) })),
        },
        moderators: {
          set: moderators.map((id) => ({ id: parseInt(id) })),
        },
      },
    });

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error("Chyba pri úprave eventu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};
