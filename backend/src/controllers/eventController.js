import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import fs from "fs"; // a ak ešte nemáš, aj fs budeš potrebovať
import { toArray, applyChangesData } from "../utils/helpers.js"; // importuj túto funkciu z utils
import { createOccurrenceIfNeeded } from "../utils/eventOccurrences.js";
import {
  createUTCDate,
  getCurrentUTCDate,
  mergeDateAndTime,
} from "../utils/dateHelpers.js";
import {
  getAllVirtualDates,
  validateEventDate,
  normalizeDate,
  getEventDayId,
  getNextEventDate,
  getAllVirtualEvents,
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
      allowRecurringAttendance,
      maxAttendancesPerCycle,
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

    if (startDate && startDate !== "undefined" && startDate !== "") {
      hasStartDate = true;
    }

    if (startTime && startTime !== "undefined" && startTime !== "") {
      hasStartTime = true;
    }

    if (endTime && endTime !== "undefined" && endTime !== "") {
      hasEndTime = true;
    }

    // Manuálna konštrukcia dátumu v lokálnom čase bez UTC posunu
    if (hasStartDate || hasStartTime) {
      if (hasStartTime) {
        computedStartDate = createUTCDate(startDate, startTime);
      } else {
        computedStartDate = createUTCDate(startDate);
      }
    } else {
      computedStartDate = getCurrentUTCDate();
    }

    if (hasEndTime) {
      computedEndDate = createUTCDate(null, endTime);
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
        allowRecurringAttendance: allowRecurringAttendance === "true",
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
        attendancyLimit: parseInt(maxAttendancesPerCycle),
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

export const getAllEvents = async (req, res) => {
  try {
    const allEvents = await prisma.event.findMany({
      include: {
        categories: true,
        eventDays: { include: { day: true, eventChange: true } },
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
            eventDay: { include: { eventChange: true } },
            participants: true,
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
        const changedEvent = applyChangesData(
          { ...event, startDate: mergeDateAndTime(event.startDate, occ.date) },
          [occ?.eventChange, occ?.eventDay?.eventChange]
        );
        instances.push({
          ...changedEvent,
          date: occ.date,
          virtual: false,
          participants: occ.participants,
        });
      }

      if (isRecurring) {
        const virtualEvents = getAllVirtualEvents(event, now);

        for (const virtualEvent of virtualEvents) {
          instances.push(virtualEvent);
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

export const applyChanges = async (
  prismaClient, // prisma alebo tx
  eventId,
  targetDate,
  fieldsToOverride = []
) => {
  const event = await prismaClient.event.findUnique({
    where: { id: eventId },
    include: {
      eventDays: {
        include: {
          eventChange: true,
          day: true,
        },
      },
    },
  });

  if (!event) throw new Error("Event not found");

  const eventDayId = getEventDayId(event, targetDate);

  const [eventDay, occurrence] = await Promise.all([
    eventDayId
      ? prismaClient.eventDay.findUnique({
          where: { id: eventDayId },
          include: { eventChange: true },
        })
      : null,
    prismaClient.eventOccurrence.findFirst({
      where: {
        eventId: event.id,
        date: targetDate,
      },
      include: { eventChange: true },
    }),
  ]);

  return applyChangesData(
    event,
    [occurrence?.eventChange, eventDay?.eventChange],
    fieldsToOverride,
    { startDate: targetDate }
  );
};

function canJoinEventToday(targetDate, joinDaysBeforeStart) {
  if (!joinDaysBeforeStart) {
    return true;
  }
  const today = normalizeDate(getCurrentUTCDate());

  const startDate = normalizeDate(targetDate);

  let joinStartDate = new Date(targetDate);
  joinStartDate.setDate(startDate.getDate() - joinDaysBeforeStart);
  joinStartDate = normalizeDate(joinStartDate);

  return today >= joinStartDate && today <= startDate;
}

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

    const event = await applyChanges(prisma, parseInt(id), targetDate, [
      "capacity",
      "joinDaysBeforeStart",
      "startDate",
    ]);

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    // 2. Všetko robíme v rámci transakcie, aby sme boli thread-safe
    await prisma.$transaction(async (tx) => {
      // 2.1. Získaj alebo vytvor occurrence
      let occurrence = await tx.eventOccurrence.findFirst({
        where: {
          eventId: event.id,
          date: targetDate,
        },
        include: {
          participants: {
            select: { id: true },
          },
        },
      });

      if (!occurrence) {
        const validDate = validateEventDate(event, targetDate);
        const eventDayId = getEventDayId(event, targetDate);

        if (!validDate) {
          throw new Error("Event sa v daný deň nekoná.");
        }

        occurrence = await tx.eventOccurrence.create({
          data: {
            event: { connect: { id: event.id } },
            date: targetDate,
            eventDay: eventDayId && { connect: { id: eventDayId } },
          },
          include: {
            participants: {
              select: { id: true },
            },
          },
        });
      }

      // 2.2. Skontroluj, či už je používateľ prihlásený
      const alreadyJoined = occurrence.participants.some(
        (p) => p.id === userId
      );
      if (alreadyJoined) {
        throw new Error("Už si prihlásený na tento event.");
      }

      // 2.3. Skontroluj kapacitu
      if (event.capacity && occurrence.participants.length >= event.capacity) {
        throw new Error("Kapacita eventu je naplnená.");
      }

      if (!canJoinEventToday(event.startDate, event.joinDaysBeforeStart)) {
        throw new Error("Neda sa este prihlasit");
      }

      // 2.4. Pridaj používateľa
      await tx.eventOccurrence.update({
        where: { id: occurrence.id },
        data: {
          participants: {
            connect: { id: userId },
          },
        },
      });
    });

    return res.json({ message: "Úspešne prihlásený na event." });
  } catch (err) {
    console.error("Chyba pri prihlasovaní na event:", err);
    const msg = err?.message || "Chyba servera.";
    return res.status(400).json({ message: msg });
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
    const eventDayId = getEventDayId(event, targetDate);
    let eventDay = null;
    if (eventDayId !== null) {
      eventDay = await prisma.eventDay.findUnique({
        where: { id: eventDayId },
        include: {
          users: true,
          eventChange: true, // toto je tvoje "eventDayAttendancy"
        },
      });
    }

    const occurrence = event.eventOccurrences[0];
    if (occurrence) {
      return res.json({
        ...event,
        date: occurrence.date,
        eventChange: occurrence.eventChange,
        eventChangeDay: eventDay?.eventChange || null,
        participants: occurrence.participants,
        attendants: eventDay?.users || [],
        eventDayId: eventDayId,
        occurrenceId: occurrence.id,
        startDate: mergeDateAndTime(event.startDate, targetDate),

        virtual: false,
      });
    }

    return res.json({
      ...event,
      eventChangeDay: eventDay?.eventChange || null,
      virtual: true,
      attendants: eventDay?.users || [],
      date: targetDate,
      eventDayId: eventDayId,
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

export const attendEventDays = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);
    const { eventDayIds } = req.body;

    if (!Array.isArray(eventDayIds)) {
      return res.status(400).json({ message: "Neplatný formát požiadavky." });
    }

    // Získaj event s kapacitou
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    // Všetko v transakcii, aby sme sa vyhli race condition
    await prisma.$transaction(async (tx) => {
      // Získaj všetky dni eventu, kde môže byť používateľ prihlásený
      const allEventDays = await tx.eventDay.findMany({
        where: { eventId },
        include: {
          users: { select: { id: true } },
          eventChange: true,
        },
      });

      const toConnect = eventDayIds;
      const toDisconnect = allEventDays
        .filter(
          (ed) =>
            ed.users.some((u) => u.id === userId) &&
            !eventDayIds.includes(ed.id)
        )
        .map((ed) => ed.id);

      // Over kapacitu pre každý deň, na ktorý sa používateľ chce prihlásiť
      for (const dayId of toConnect) {
        const day = allEventDays.find((d) => d.id === dayId);

        if (!day) {
          throw new Error(`Deň s ID ${dayId} neexistuje.`);
        }

        const isAlreadyRegistered = day.users.some((u) => u.id === userId);
        const currentCount = day.users.length;

        if (
          !isAlreadyRegistered &&
          event.capacity &&
          currentCount >= (day?.eventChange?.capacity || event.capacity)
        ) {
          throw new Error(`Kapacita pre deň ${dayId} je naplnená.`);
        }
      }

      // Odpojiť z dní, kde už nemá byť
      await Promise.all(
        toDisconnect.map((id) =>
          tx.eventDay.update({
            where: { id },
            data: {
              users: {
                disconnect: { id: userId },
              },
            },
          })
        )
      );

      // Pripojiť k novým dňom
      await Promise.all(
        toConnect.map((id) =>
          tx.eventDay.update({
            where: { id },
            data: {
              users: {
                connect: { id: userId },
              },
            },
          })
        )
      );
    });

    res.json({ message: "Prihlásenie na dni aktualizované." });
  } catch (err) {
    console.error("Chyba pri aktualizácii účasti na dňoch:", err);
    res.status(400).json({ message: err.message || "Chyba servera." });
  }
};

function buildEventChangePayload(
  newDataRaw,
  original,
  computedStartDate,
  computedEndDate,
  targetBaseDate
) {
  const newData = {};

  const nullIfSame = (key, newValue, originalValue) => {
    newData[key] =
      newValue === undefined
        ? null
        : newValue === originalValue
        ? null
        : newValue;
  };

  newData.hasEndTime =
    newDataRaw?.endTime !== "null" && newDataRaw?.endTime !== "undefined";
  newData.hasStartDate =
    newDataRaw?.startDate !== "null" && newDataRaw?.startDate !== "undefined";
  newData.hasStartTime =
    newDataRaw?.startTime !== "null" && newDataRaw?.startTime !== "undefined";

  // Spracovanie dátumu s kombináciou času
  // if (targetBaseDate && original.startDate) {
  //   const originalStart = new Date(original.startDate);
  //   const base = new Date(targetBaseDate);
  //   base.setUTCHours(
  //     originalStart.getUTCHours(),
  //     originalStart.getUTCMinutes(),
  //     0,
  //     0
  //   );
  //   computedStartDate = base;
  // }

  // if (targetBaseDate && original.endDate) {
  //   const originalEnd = new Date(original.endDate);
  //   const base = new Date(targetBaseDate);
  //   base.setUTCHours(
  //     originalEnd.getUTCHours(),
  //     originalEnd.getUTCMinutes(),
  //     0,
  //     0
  //   );
  //   computedEndDate = base;
  // }

  // StartDate
  newData.startDate =
    computedStartDate &&
    (!original.startDate ||
      new Date(original.startDate).getTime() !==
        new Date(computedStartDate).getTime())
      ? computedStartDate
      : null;

  // EndDate
  newData.endDate =
    computedEndDate &&
    (!original.endDate ||
      new Date(original.endDate).getTime() !==
        new Date(computedEndDate).getTime())
      ? computedEndDate
      : null;

  // Ostatné polia
  nullIfSame("title", newDataRaw.title, original.title);
  nullIfSame("description", newDataRaw.description, original.description);
  nullIfSame("location", newDataRaw.location, original.location);

  nullIfSame(
    "capacity",
    newDataRaw.capacity ? parseInt(newDataRaw.capacity) : undefined,
    original.capacity
  );

  nullIfSame(
    "joinDaysBeforeStart",
    newDataRaw.joinDaysBeforeStart
      ? parseInt(newDataRaw.joinDaysBeforeStart)
      : undefined,
    original.joinDaysBeforeStart
  );

  nullIfSame(
    "allowRecurringAttendance",
    typeof newDataRaw.allowRecurringAttendance === "boolean"
      ? newDataRaw.allowRecurringAttendance
      : undefined,
    original.allowRecurringAttendance
  );

  return newData;
}

async function updateEventImages({
  files,
  mainImageChanged,
  deletedGallery,
  previousMainImage,
  eventId,
}) {
  // 1. Vymaž starý hlavný obrázok ak bol zmenený a nový nie je prítomný
  if (mainImageChanged && !files?.mainImage?.[0] && previousMainImage) {
    const oldPath = path.join(".", previousMainImage);
    try {
      if (fs.existsSync(oldPath) && fs.statSync(oldPath).isFile()) {
        fs.unlinkSync(oldPath);
      }
    } catch (err) {
      console.warn("⚠️ Chyba pri mazaní hlavného obrázka:", err.message);
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { mainImage: null },
    });
  }

  // 2. Nastavenie nového hlavného obrázka (ak je)
  if (mainImageChanged && files?.mainImage?.[0]) {
    const mainImageUrl = `/uploads/events/${files.mainImage[0].filename}`;
    await prisma.event.update({
      where: { id: eventId },
      data: { mainImage: mainImageUrl },
    });

    // Zmaž predchádzajúci obrázok, ak existuje a je iný
    if (
      previousMainImage &&
      previousMainImage !== mainImageUrl &&
      fs.existsSync(path.join(".", previousMainImage)) &&
      fs.statSync(path.join(".", previousMainImage)).isFile()
    ) {
      fs.unlinkSync(path.join(".", previousMainImage));
    }
  }

  // 2.5 Vymazanie označených galérií (DB aj súbory)
  if (Array.isArray(deletedGallery) && deletedGallery.length > 0) {
    const strippedUrls = deletedGallery.map((fullUrl) => {
      try {
        const url = new URL(fullUrl);
        return url.pathname; // napr. "/uploads/events/obrazok.png"
      } catch {
        return fullUrl; // fallback
      }
    });

    // 🧹 Vymazanie súborov
    for (const filePath of strippedUrls) {
      const absolute = path.join(".", filePath);
      try {
        if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
          fs.unlinkSync(absolute);
        }
      } catch (err) {
        console.warn(
          "⚠️ Nepodarilo sa zmazať galérijný súbor:",
          filePath,
          err.message
        );
      }
    }

    // 🧹 Vymazanie z databázy
    await prisma.eventImage.deleteMany({
      where: {
        eventId,
        url: { in: strippedUrls },
      },
    });
  }

  // 3. Pridanie novej galérie
  if (files?.gallery?.length) {
    const newGalleryUrls = files.gallery.map(
      (file) => `/uploads/events/${file.filename}`
    );

    await prisma.event.update({
      where: { id: eventId },
      data: {
        gallery: {
          create: newGalleryUrls.map((url) => ({ url })),
        },
      },
    });
  }
}

export const editEvent = async (req, res) => {
  try {
    const { scope, eventDayId, occurrenceId } = req.body;
    const userId = req.user.id;
    const eventId = parseInt(req.body.id);

    if (!eventId || !scope) {
      return res.status(400).json({ message: "Chýbajúce parametre." });
    }

    const {
      title,
      description,
      startDate,
      location,
      capacity,
      attendancyLimit,
      allowRecurringAttendance,
      joinDaysBeforeStart,
      repeatUntil,
      repeatInterval,
      repeatDays,
      startTime,
      endTime,
    } = req.body;

    const categoryIds = toArray(req.body.categoryIds);

    const rawGallery = req.body.deletedGallery;

    const deletedGallery =
      typeof rawGallery === "string"
        ? rawGallery.split(",").map((url) => {
            try {
              const parsed = new URL(url);
              return parsed.pathname; // odstráni "http://localhost:5000"
            } catch {
              return url; // fallback, ak to už je len cesta
            }
          })
        : [];

    let computedStartDate = null;
    let computedEndDate = null;
    let hasStartDate = false;
    let hasStartTime = false;
    let hasEndTime = false;

    if (startDate && startDate !== "undefined" && startDate !== "") {
      hasStartDate = true;
    }

    if (startTime && startTime !== "undefined" && startTime !== "") {
      hasStartTime = true;
    }

    if (endTime && endTime !== "undefined" && endTime !== "") {
      hasEndTime = true;
    }

    // Manuálna konštrukcia dátumu v lokálnom čase bez UTC posunu
    if (hasStartDate || hasStartTime) {
      if (hasStartTime) {
        console.log("1");
        computedStartDate = createUTCDate(startDate, startTime);
      } else {
        console.log("2");

        computedStartDate = createUTCDate(startDate);
      }
    } else {
      console.log("3");

      computedStartDate = getCurrentUTCDate();
    }

    if (hasEndTime) {
      computedEndDate = createUTCDate(startDate, endTime);
    }

    if (scope === "event") {
      await updateEventImages({
        files: req.files,
        mainImageChanged: req.body.mainImageChanged === "true",
        deletedGallery: deletedGallery,
        eventId,
        previousMainImage: req.body.previousMainImage || null,
      });

      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          title,
          description,
          startDate: computedStartDate,
          endDate: computedEndDate,
          hasStartDate,
          hasStartTime,
          hasEndTime,
          location,
          capacity: parseInt(capacity),
          attendancyLimit: parseInt(attendancyLimit),
          allowRecurringAttendance: allowRecurringAttendance === "true",
          joinDaysBeforeStart: parseInt(joinDaysBeforeStart),
          repeatUntil:
            repeatUntil !== "null" ? createUTCDate(repeatUntil) : null,
          categories: {
            set: categoryIds.map((id) => ({ id: parseInt(id) })),
          },
        },
      });

      // Spracovanie repeatDays
      const parsedRepeatDays = JSON.parse(repeatDays || "{}");

      const existingDays = await prisma.eventDay.findMany({
        where: { eventId },
        include: { day: true },
      });

      const newWeekDayPairs = Object.entries(parsedRepeatDays).flatMap(
        ([week, days]) =>
          days.map((day) => ({ week: parseInt(week), dayId: parseInt(day) }))
      );

      // Vymaž staré dni + occurrences, ktoré sa na ne viažu
      for (const oldDay of existingDays) {
        const stillExists = newWeekDayPairs.some(
          (pair) => pair.week === oldDay.week && pair.dayId === oldDay.day.id
        );

        if (!stillExists) {
          // Vymaž occurrences naviazané na tento deň
          await prisma.eventOccurrence.deleteMany({
            where: { eventDayId: oldDay.id },
          });

          // Vymaž samotný eventDay
          await prisma.eventDay.delete({ where: { id: oldDay.id } });
        }
      }

      // Pridaj nové dni, ktoré ešte neexistujú
      for (const pair of newWeekDayPairs) {
        const alreadyExists = existingDays.some(
          (ed) => ed.week === pair.week && ed.day.id === pair.dayId
        );

        if (!alreadyExists) {
          await prisma.eventDay.create({
            data: {
              event: { connect: { id: eventId } },
              week: pair.week,
              day: { connect: { id: pair.dayId } },
            },
          });
        }
      }

      // Vytvor nové occurrences podľa aktuálneho stavu
      await createOccurrenceIfNeeded(eventId);

      return res.json(updated);
    }

    if (scope === "eventDay") {
      if (!eventDayId) {
        return res.status(400).json({ message: "Chýba eventDayId." });
      }

      const eventDay = await prisma.eventDay.findUnique({
        where: { id: parseInt(eventDayId) },
        include: {
          event: true,
        },
      });

      if (!eventDay) {
        return res.status(404).json({ message: "EventDay neexistuje." });
      }

      const original = eventDay.event;
      const newData = buildEventChangePayload(
        req.body,
        original,
        computedStartDate,
        computedEndDate // použijeme startDate eventDay ako základ pre nový dátum
      );

      let change = await prisma.eventChange.findFirst({
        where: {
          eventDay: {
            id: parseInt(eventDayId),
          },
        },
      });

      if (change) {
        change = await prisma.eventChange.update({
          where: { id: change.id },
          data: { ...newData, updatedByUser: { connect: { id: userId } } },
        });
      } else {
        change = await prisma.eventChange.create({
          data: {
            ...newData,
            eventDay: { connect: { id: parseInt(eventDayId) } },
            createdByUser: { connect: { id: userId } },
          },
        });
      }

      return res.json(change);
    }

    if (scope === "occurrence") {
      if (parseInt(req.body.repeatInterval) === 0) {
        await updateEventImages({
          files: req.files,
          mainImageChanged: req.body.mainImageChanged === "true",
          deletedGallery: deletedGallery,
          eventId,
          previousMainImage: req.body.previousMainImage || null,
        });

        await prisma.event.update({
          where: { id: eventId },
          data: {
            categories: {
              set: categoryIds.map((id) => ({ id: parseInt(id) })),
            },
          },
        });
      }

      if (!eventId || !computedStartDate) {
        return res.status(400).json({ message: "Chýba eventId alebo dátum." });
      }
      console.log("req.date");
      console.log(req.body.date);
      // Skús nájsť existujúcu occurrence pre daný event a dátum
      let occurrence = await prisma.eventOccurrence.findFirst({
        where: {
          eventId: parseInt(eventId),
          date: req.body.date,
        },
        include: {
          event: true,
          eventChange: true,
        },
      });

      // Ak neexistuje, vytvor ju
      if (!occurrence) {
        const event = await prisma.event.findUnique({
          where: { id: parseInt(eventId) },
          include: { eventDays: { include: { day: true } } },
        });

        if (!event) {
          return res.status(404).json({ message: "Event neexistuje." });
        }

        // Validácia dátumu (napr. či patrí do cyklu)
        const validDate = getNextEventDate(event, req.body.date);
        if (!validDate) {
          return res
            .status(400)
            .json({ message: "Neplatný dátum pre tento event." });
        }

        occurrence = await prisma.eventOccurrence.create({
          data: {
            event: { connect: { id: event.id } },
            date: validDate,
          },
          include: {
            event: true,
            eventChange: true,
          },
        });
      }

      const original = occurrence.event;
      const newData = buildEventChangePayload(
        req.body,
        original,
        computedStartDate,
        computedEndDate,
        req.body.date
      );

      if (Object.keys(newData).length === 0) {
        return res
          .status(200)
          .json({ message: "Žiadne zmeny neboli zistené." });
      }

      if (occurrence.eventChangeId) {
        const updatedChange = await prisma.eventChange.update({
          where: { id: occurrence.eventChangeId },
          data: { ...newData, updatedByUser: { connect: { id: userId } } },
        });
        return res.json(updatedChange);
      } else {
        const newChange = await prisma.eventChange.create({
          data: { ...newData, createdByUser: { connect: { id: userId } } },
        });

        await prisma.eventOccurrence.update({
          where: { id: occurrence.id },
          data: { eventChangeId: newChange.id },
        });

        return res.json(newChange);
      }
    }

    return res.status(400).json({ message: "Neznámy scope." });
  } catch (err) {
    console.error("Chyba pri editácii eventu:", err);
    res.status(500).json({ message: "Chyba servera." });
  }
};

export const updateEventModerators = async (req, res) => {
  const moderators = req.body;
  const { id: eventIdParam } = req.params;
  const eventId = parseInt(eventIdParam, 10);

  if (!eventId || !Array.isArray(moderators)) {
    return res
      .status(400)
      .json({ error: "Missing eventId or moderators array" });
  }

  try {
    // 1. Získaj všetkých aktuálnych moderátorov eventu
    const existing = await prisma.eventModerator.findMany({
      where: { eventId },
    });

    const existingIds = existing.map((m) => m.id);

    // 2. Priprav nové updaty/vytvárania

    await Promise.all(
      moderators.map(async (mod) => {
        const {
          moderatorId,
          id: userId,
          canEditEvent = false,
          canManageParticipants = false,
          canManageAttendees = false,
          canManageModerators = false,
          canRepostEvent = false,
        } = mod;

        if (moderatorId) {
          return prisma.eventModerator.update({
            where: { id: moderatorId },
            data: {
              canEditEvent,
              canManageParticipants,
              canManageAttendees,
              canManageModerators,
              canRepostEvent,
            },
          });
        } else {
          return prisma.eventModerator.create({
            data: {
              userId,
              eventId,
              canEditEvent,
              canManageParticipants,
              canManageAttendees,
              canManageModerators,
              canRepostEvent,
            },
          });
        }
      })
    );

    // 3. (Nepovinné) Vymaž moderátorov, ktorí boli odstránení z formulára
    const receivedIds = moderators.map((m) => m.moderatorId).filter(Boolean);
    const toDelete = existingIds.filter((id) => !receivedIds.includes(id));

    await prisma.eventModerator.deleteMany({
      where: { id: { in: toDelete } },
    });

    res.status(200).json("Updated");
  } catch (error) {
    console.error("Failed to upsert moderators:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteRecurringAttendance = async (req, res) => {
  const { id: eventIdParam, eventDayId, userId } = req.params;

  if (!eventDayId || !userId) {
    return res.status(400).json({ error: "Missing eventDayId or userId" });
  }

  try {
    await prisma.eventDay.update({
      where: { id: parseInt(eventDayId) },
      data: {
        users: {
          disconnect: { id: parseInt(userId) },
        },
      },
    });

    res
      .status(200)
      .json({ message: "User removed from recurring attendance." });
  } catch (error) {
    console.error("Error removing recurring attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSingleAttendance = async (req, res) => {
  const { id: eventIdParam, occurrenceId, userId } = req.params;

  if (!occurrenceId || !userId) {
    return res.status(400).json({ error: "Missing occurrenceId or userId" });
  }

  try {
    await prisma.eventOccurrence.update({
      where: { id: parseInt(occurrenceId) },
      data: {
        participants: {
          disconnect: { id: parseInt(userId) },
        },
      },
    });

    res.status(200).json({ message: "User removed from single attendance." });
  } catch (error) {
    console.error("Error removing single attendance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
