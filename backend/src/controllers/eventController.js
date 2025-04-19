import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import fs from "fs"; // a ak ešte nemáš, aj fs budeš potrebovať
import { toArray } from "../utils/helpers.js"; // importuj túto funkciu z utils
import { createOccurrenceIfNeeded } from "../utils/eventOccurrences.js";
import { createUTCDate, getCurrentUTCDate } from "../utils/dateHelpers.js";
import {
  getAllVirtualDates,
  validateEventDate,
  normalizeDate,
  getEventDayId,
  getNextEventDate,
} from "../utils/virtualizationHelpers.js";

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      startTime,
      endTime,
      repeatUntil,
      location,
      capacity,
      attendancyLimit,
      joinDaysBeforeStart,
      repeatDays,
      repeatInterval,
      allowRecurringParticipation,
    } = req.body;

    const categoryIds = toArray(req.body.categoryIds);
    const moderatorsRaw = toArray(req.body.moderators);
    const moderators = moderatorsRaw.map((mod) => JSON.parse(mod));

    if (!title) {
      return res.status(400).json({ message: "Vyplň všetky povinné polia." });
    }

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

    let computedStartDate = null;
    let computedEndDate = null;
    let hasStartDate = false;
    let hasStartTime = false;
    let hasEndTime = false;

    if (startDate) {
      hasStartDate = true;
    }

    if (startTime) {
      hasStartTime = true;
    }

    if (endTime) {
      hasEndTime = true;
    }

    // Manuálna konštrukcia dátumu v lokálnom čase bez UTC posunu
    if (startDate || startTime) {
      if (startTime) {
        computedStartDate = createUTCDate(startDate, startTime);
      } else {
        computedStartDate = createUTCDate(startDate);
      }
    }

    if (endTime) {
      computedEndDate = createUTCDate(startDate, endTime);
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        startDate: computedStartDate,
        endDate: computedEndDate,
        repeatUntil: repeatUntil ? createUTCDate(repeatUntil) : null,
        repeatInterval: repeatInterval ? parseInt(repeatInterval) : null,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        attendancyLimit: attendancyLimit ? parseInt(attendancyLimit) : null,
        allowRecurringAttendance: allowRecurringParticipation === "true",
        joinDaysBeforeStart: joinDaysBeforeStart
          ? parseInt(joinDaysBeforeStart)
          : null,
        mainImage: mainImageUrl,
        gallery: galleryUrls.length
          ? {
              create: galleryUrls.map((url) => ({ url })),
            }
          : undefined,
        hasStartDate,
        hasStartTime,
        hasEndTime,
        organizer: {
          connect: { id: req.user.id },
        },
        categories: {
          connect: categoryIds.map((id) => ({ id: parseInt(id) })),
        },
      },
    });

    if (moderators.length) {
      await prisma.event.update({
        where: { id: newEvent.id },
        data: {
          moderators: {
            create: moderators.map((mod) => ({
              user: { connect: { id: mod.id } },
              canEditEvent: mod.canEditEvent,
              canManageParticipants: mod.canManageParticipants,
              canManageAttendees: mod.canManageAttendees,
              canManageModerators: mod.canManageModerators,
              canRepostEvent: mod.canRepostEvent,
            })),
          },
        },
      });
    }

    if (repeatDays) {
      const parsedRepeatDays = JSON.parse(repeatDays);

      for (const [week, days] of Object.entries(parsedRepeatDays)) {
        for (const id of days) {
          await prisma.eventDay.create({
            data: {
              event: {
                connect: { id: newEvent.id },
              },
              week: parseInt(week),
              day: {
                connect: { id: parseInt(id) },
              },
            },
          });
        }
      }
    }

    await createOccurrenceIfNeeded(newEvent.id);

    res.status(201).json({ id: newEvent.id });
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
import {
  startOfWeek,
  addWeeks,
  setDay,
  isAfter,
  isBefore,
  isEqual,
} from "date-fns";
import { get } from "http";
import { is } from "date-fns/locale";

export const getAllEvents = async (req, res) => {
  try {
    const allEvents = await prisma.event.findMany({
      include: {
        categories: true,
        gallery: true,
        eventDays: { include: { day: true } },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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
        eventOccurrences: {
          include: {
            eventChange: true,
          },
        },
      },
    });

    const now = getCurrentUTCDate();
    const instances = [];

    for (const event of allEvents) {
      const isRecurring = event.eventDays.length > 0;
      const hasOccurrence = event.eventOccurrences.length > 0;

      for (const occ of event.eventOccurrences) {
        instances.push({
          ...event,
          date: occ.date,
          virtual: false,
          eventChange: occ.eventChange || null,
        });
      }

      if (isRecurring) {
        const virtualDates = getAllVirtualDates(event, now);

        for (const date of virtualDates) {
          instances.push({ ...event, date, virtual: true });
        }
      }

      if (!isRecurring && !hasOccurrence) {
        const date = event.startDate || null;
        instances.push({ ...event, date, virtual: false });
      }
    }

    instances.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    res.json(instances);
  } catch (err) {
    console.error("Chyba pri načítaní eventov:", err);
    res.status(500).json({ message: "Chyba pri načítaní eventov." });
  }
};

export const joinEvent = async (req, res) => {
  try {
    const { id } = req.params; // event id
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res
        .status(400)
        .json({ message: "Chýba dátum v query parametri." });
    }

    const targetDate = normalizeDate(date);

    // 1. Načítaj event s jeho eventDays
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        eventDays: { include: { day: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    // 2. Skús nájsť existujúci occurrence
    let occurrence = await prisma.eventOccurrence.findFirst({
      where: {
        eventId: event.id,
        date: targetDate,
      },
    });

    // 3. Ak neexistuje a event je platný na daný deň, vytvor occurrence
    if (!occurrence) {
      const validDate = validateEventDate(event, targetDate);

      if (!validDate) {
        return res.status(400).json({ message: "Event sa v daný deň nekoná." });
      }

      occurrence = await prisma.eventOccurrence.create({
        data: {
          event: { connect: { id: event.id } },
          date: targetDate,
        },
      });
    }

    // 4. Pridaj používateľa do occurrence
    await prisma.eventOccurrence.update({
      where: { id: occurrence.id },
      data: {
        participants: {
          connect: { id: userId },
        },
      },
    });

    return res.json({ message: "Úspešne prihlásený na event." });
  } catch (err) {
    console.error("Chyba pri prihlasovaní na event:", err);
    return res.status(500).json({ message: "Chyba servera." });
  }
};

export const getEventByDate = async (req, res) => {
  try {
    const { id } = req.params;
    const targetDate = normalizeDate(req.query.date);

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        categories: true,
        gallery: true,
        eventDays: {
          include: {
            day: true,
            users: true, // 👈 toto je `eventDayAttendancy`
          },
        },
        organizer: true,
        moderators: {
          include: {
            user: true,
          },
        },
        eventOccurrences: {
          where: { date: targetDate },
          include: {
            eventChange: true,
            participants: true, // 👈 toto je `occurrenceParticipants`
          },
        },
      },
    });

    const validDate = validateEventDate(event, targetDate);

    if (!validDate) {
      return res.status(400).json({ message: "Event sa v daný deň nekoná." });
    }

    if (!event) return res.status(404).json({ message: "Event neexistuje." });
    console.log(event);
    const eventDayId = getEventDayId(event, targetDate);
    let attendants = null;
    console.log("eventDayId", eventDayId);
    if (eventDayId !== null) {
      attendants = await prisma.eventDay.findUnique({
        where: { id: eventDayId },
        include: {
          users: true, // toto je tvoje "eventDayAttendancy"
        },
      });
    }

    const occurrence = event.eventOccurrences[0];
    if (occurrence) {
      console.log("ma occurence");
      return res.json({
        ...event,
        date: occurrence.date,
        eventChange: occurrence.eventChange,
        participants: occurrence.participants,
        attendants: attendants?.users || [],
        virtual: false,
      });
    }

    return res.json({
      ...event,
      eventChange: null,
      virtual: true,
      attendants: attendants?.users || [],
      date: getNextEventDate(event, targetDate),
    });
  } catch (err) {
    console.error("Chyba pri načítaní eventu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const leaveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const targetDate = normalizeDate(req.query.date);

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        eventOccurrences: {
          where: { date: targetDate },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    console.log(event);

    const occurrence = event.eventOccurrences[0];

    if (!occurrence) {
      return res.status(404).json({ message: "Výskyt eventu sa nenašiel." });
    }

    const wasJoined = await prisma.eventOccurrence.update({
      where: { id: occurrence.id },
      data: {
        participants: {
          disconnect: { id: userId },
        },
      },
    });

    return res.status(200).json({ message: "Úspešne odhlásený z eventu." });
  } catch (err) {
    console.error("Chyba pri odhlasovaní z eventu:", err);
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
