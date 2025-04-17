import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import fs from "fs"; // a ak ešte nemáš, aj fs budeš potrebovať
import { toArray } from "../utils/helpers.js"; // importuj túto funkciu z utils

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
      seriesId,
    } = req.body;

    const categoryIds = toArray(req.body.categoryIds);
    const moderatorsRaw = toArray(req.body.moderators);
    const moderators = moderatorsRaw.map((mod) => JSON.parse(mod));
    console.log(moderators);

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

    // 🌱 Vytvorenie alebo získanie série
    const actualSeriesId = seriesId || crypto.randomUUID();

    // Ak seriesId ešte neexistuje, vytvor záznam v EventSeries
    if (!seriesId) {
      await prisma.eventSeries.create({
        data: {
          id: actualSeriesId,
        },
      });
    }

    // 📅 Vytvorenie samotného eventu
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
        series: {
          connect: { id: actualSeriesId },
        },

        gallery: galleryUrls.length
          ? {
              create: galleryUrls.map((url) => ({ url })),
            }
          : undefined,
        organizer: {
          connect: { id: req.user.id },
        },
        categories: {
          connect: categoryIds.map((id) => ({ id: parseInt(id) })),
        },
      },
      include: {
        categories: true,
        series: true,
      },
    });

    // 👥 Priradenie moderátorov k sérii (ak to nie je opakovanie)
    if (moderators.length) {
      await prisma.eventModerator.createMany({
        data: moderators.map((mod) => ({
          userId: mod.id,
          seriesId: actualSeriesId,
          canEditEvent: mod.canEditEvent,
          canManageParticipants: mod.canManageParticipants,
          canManageSubscribers: mod.canManageSubscribers,
          canManageModerators: mod.canManageModerators,
          canRepostEvent: mod.canRepostEvent,
        })),
        skipDuplicates: true, // pre prípad, že sa znovu vytvára event zo série
      });
    }

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
        series: {
          include: {
            moderators: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Ak chceš späť kompatibilitu (napr. `event.moderators`), môžeš si to premapovať:
    const formatted = events.map((event) => ({
      ...event,
      moderators:
        event.series?.moderators?.map((mod) => ({
          ...mod.user,
          ...mod, // pridá aj permissions
        })) || [],
    }));

    res.json(formatted);
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
        series: {
          include: {
            moderators: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
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

    console.log(event);

    res.json({
      ...event,
      organizer: addProfileUrl(event.organizer),
      moderators: event.series.moderators.map(addProfileUrl),
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

export const updateEventDetails = async (req, res) => {
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

  console.log("kategorie");

  console.log(req.body.categoryIds);

  const categoryIds = toArray(req.body.categoryIds);
  const deletedGallery = toArray(req.body.deletedGallery);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { gallery: true },
    });

    if (!event) return res.status(404).json({ message: "Event nenájdený." });

    // Vymazanie starej galérie
    if (deletedGallery.length > 0) {
      const relativePaths = deletedGallery.map((fullUrl) =>
        new URL(fullUrl).pathname.replace(/^\/+/, "/")
      );

      await prisma.eventImage.deleteMany({
        where: { url: { in: relativePaths } },
      });

      relativePaths.forEach((urlPath) => {
        const pathWithoutLeadingSlash = urlPath.replace(/^\/+/, "");
        const filePath = path.join(pathWithoutLeadingSlash);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    // Nové fotky galérie
    const newGalleryImages = req.files?.gallery || [];
    const galleryData = newGalleryImages.map((file) => ({
      url: "/uploads/events/" + file.filename,
      eventId: event.id,
    }));
    await prisma.eventImage.createMany({ data: galleryData });

    // Main image
    let mainImageUrl = event.mainImage || null;

    if (mainImageChanged === "true") {
      if (event.mainImage) {
        const oldRelativePath = event.mainImage.replace(/^\/+/, "");
        const oldPath = path.join("uploads", oldRelativePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      if (req.files?.mainImage?.[0]) {
        mainImageUrl = "/uploads/events/" + req.files.mainImage[0].filename;
      } else {
        mainImageUrl = null;
      }
    }

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
      },
    });

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error("Chyba pri úprave detailov eventu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const updateEventModerators = async (req, res) => {
  const eventId = parseInt(req.params.id);
  const moderatorsRaw = toArray(req.body.moderators);

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { series: true },
    });

    if (!event) return res.status(404).json({ message: "Event nenájdený." });

    const parsed = moderatorsRaw.map((m) => JSON.parse(m));

    await prisma.eventModerator.deleteMany({
      where: { seriesId: event.seriesId },
    });

    await prisma.eventModerator.createMany({
      data: parsed.map((mod) => ({
        userId: mod.id,
        seriesId: event.seriesId,
        canEditEvent: mod.canEditEvent,
        canManageParticipants: mod.canManageParticipants,
        canManageSubscribers: mod.canManageSubscribers,
        canManageModerators: mod.canManageModerators,
        canRepostEvent: mod.canRepostEvent,
      })),
    });

    res.status(200).json({ message: "Moderátori aktualizovaní." });
  } catch (err) {
    console.error("Chyba pri úprave moderátorov:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};
