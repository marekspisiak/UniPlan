import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import { promises as fs } from "fs";
import { toArray, applyChangesData, isEmpty } from "../utils/helpers.js"; // importuj túto funkciu z utils
import {
  createOccurrenceIfNeeded,
  createOccurrence,
} from "../utils/eventOccurrences.js";
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
import { createRoom, joinRoom } from "../services/roomService.js";
import {
  eventCreateSchema,
  eventEditSchema,
  deleteSingleAttendanceParamsSchema,
  deleteRecurringAttendanceParamsSchema,
} from "../validation/eventSchemas.js";
import { AppError } from "../utils/AppError.js";

export const createEvent = async (req, res, next) => {
  try {
    const parsed = eventCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Neplatné údaje",
        errors: parsed.error.flatten(),
      });
    }

    const data = parsed.data;

    const {
      title,
      description,

      repeatUntil,
      location,
      capacity,
      attendancyLimit,
      joinDaysBeforeStart,
      repeatDays,
      repeatInterval,
      allowRecurringAttendance,
      maxAttendancesPerCycle,
      hasStartTime,
      hasEndTime,
      hasStartDate,
      startDateTime,
      endDateTime,
      moderators,
      categoryIds,
    } = data;

    const userId = req.user.id;

    let mainImageUrl = null;
    let galleryUrls = [];

    if (req.files?.mainImage?.[0]) {
      const path = req.files.mainImage[0].path.replace(/\\/g, "/");
      mainImageUrl = "/" + path;
    }

    if (req.files?.gallery?.length) {
      galleryUrls = req.files.gallery.map(
        (file) => "/" + file.path.replace(/\\/g, "/")
      );
    }

    await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          title,
          description,
          startDate: startDateTime,
          endDate: endDateTime,
          repeatUntil,
          repeatInterval: repeatInterval ?? 0,
          location,
          capacity,
          attendancyLimit,
          allowRecurringAttendance,
          joinDaysBeforeStart,

          mainImage: mainImageUrl,
          gallery: galleryUrls.length
            ? {
                create: galleryUrls.map((url) => ({ url })),
              }
            : undefined,
          hasStartDate,
          hasStartTime,
          hasEndTime,
          attendancyLimit: maxAttendancesPerCycle,
          organizer: {
            connect: { id: userId },
          },
          categories: {
            connect: categoryIds.map((id) => ({ id })),
          },
        },
      });

      const room = await createRoom(tx, { eventId: newEvent.id }); // vytvoríš room
      const roomId = room.id;

      if (moderators.length) {
        await tx.event.update({
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
        // await joinRoom(tx, roomId, userId);
      }

      // Teraz pripravíš pole všetkých userId
      const allUserIds = [
        userId, // organizátor
        ...moderators.map((mod) => mod.id), // všetci moderátori
      ];

      // A každého pripojíš do room
      for (const userId of allUserIds) {
        await joinRoom(tx, roomId, userId);
      }

      if (repeatDays) {
        for (const [week, days] of Object.entries(repeatDays)) {
          for (const id of days) {
            await tx.eventDay.create({
              data: {
                event: { connect: { id: newEvent.id } },
                week: parseInt(week),
                day: { connect: { id: parseInt(id) } },
              },
            });
          }
        }
      }
      await createOccurrenceIfNeeded(tx, newEvent.id);
      console.log(newEvent);
      res.status(201).json({ id: newEvent.id, roomId });
    });

    try {
      for (const relPath of deletedImageUrls) {
        const absPath = path.join(".", relPath);
        fs.unlink(absPath).catch((err) => {
          console.warn("⚠️ Nepodarilo sa zmazať:", absPath, err.message);
        });
      }
    } catch {}
  } catch (err) {
    console.warn(err);

    // ⚠️ Automatické mazanie súborov z req.files (v prípade chyby)
    try {
      if (req.files) {
        const allFiles = [
          ...(Array.isArray(req.files.gallery) ? req.files.gallery : []),
          ...(Array.isArray(req.files.mainImage) ? req.files.mainImage : []),
        ];

        for (const file of allFiles) {
          const absPath = file.path;
          fs.unlink(absPath).catch((e) => {
            console.warn(
              "⚠️ Nepodarilo sa zmazať dočasný súbor:",
              absPath,
              e.message
            );
          });
        }
      }
    } catch {}

    next();
  }
};

export const getEventCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" }, // zoradenie voliteľné
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Chyba servera." });
  }
};

const doesEventMatchFilters = (event, filters) => {
  const {
    search,
    searchLocation,
    onlyAvailable,
    categories,
    allCategories,
    onlySingle,
    onlyRecurring,
    daysOfWeek,
    startDate,
    endDate,
    startTime,
    endTime,
  } = filters;

  const eventStartDate = event.startDate ? new Date(event.startDate) : null;
  const eventEndDate = event.endDate ? new Date(event.endDate) : null;

  // 🕒 Výpočet eventStartTime a eventEndTime ak existujú
  const eventStartTime =
    event.hasStartTime && eventStartDate
      ? eventStartDate.getUTCHours() * 60 + eventStartDate.getUTCMinutes()
      : null;

  const eventEndTime =
    event.hasEndTime && eventEndDate
      ? eventEndDate.getUTCHours() * 60 + eventEndDate.getUTCMinutes()
      : null;

  // 1. Search podľa názvu (TITLE)
  if (search) {
    const title = event.title?.toLowerCase() || "";
    if (!title.includes(search.toLowerCase())) {
      return false;
    }
  }

  if (searchLocation) {
    const location = event.location?.toLowerCase() || "";
    if (!location.includes(searchLocation.toLowerCase())) {
      return false;
    }
  }

  // 2. Dátumy (startDate / endDate) - kontrola event.startDate
  if (startDate || endDate) {
    const searchStart = startDate ? createUTCDate(startDate) : null;
    const searchEnd = endDate ? createUTCDate(endDate) : null;

    const eventDate = event.startDate ? event.startDate : null;
    if (!eventDate) {
      return false; // ak event nemá startDate, nemá zmysel ho zobrazovať
    }

    if (searchStart && normalizeDate(eventDate) < searchStart) {
      return false;
    }

    if (searchEnd && normalizeDate(eventDate) > searchEnd) {
      return false;
    }
  }

  // 3. Dni v týždni
  const daysOfWeekArray = toArray(daysOfWeek)?.map(Number); // <-- tu zmeníš na čísla

  if (daysOfWeekArray?.length > 0) {
    if (!eventStartDate) return false;

    const dayOfWeek = eventStartDate.getUTCDay(); // 0 = nedeľa
    const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    if (!daysOfWeekArray.includes(mappedDay)) {
      return false;
    }
  }

  // 4. Čas (startTime / endTime)
  if (startTime || endTime) {
    // Ak event nemá definovaný startTime, rovno vypadáva
    if (eventStartTime === null) {
      return false;
    }

    const [startHour = 0, startMin = 0] = startTime
      ? startTime.split(":").map(Number)
      : [];
    const [endHour = 23, endMin = 59] = endTime
      ? endTime.split(":").map(Number)
      : [];

    const searchStartMinutes = startHour * 60 + startMin;
    const searchEndMinutes = endHour * 60 + endMin;

    if (startTime) {
      // Musí event začať po zadanom čase (rovné alebo neskôr)
      if (eventStartTime < searchStartMinutes) {
        return false;
      }
    }

    if (endTime) {
      // Ak existuje eventEndTime, musí byť pred koncom
      if (eventEndTime !== null) {
        if (eventEndTime > searchEndMinutes) {
          return false;
        }
      }
      // Ak eventEndTime nie je, je to OK - berieme že event končí v rozumnom čase
    }
  }

  // 5. Kapacita (len voľné kapacity)
  if (onlyAvailable) {
    if (event?.capacity && event?.participants?.length >= event?.capacity) {
      return false;
    }
  }

  // 6. Opakovanie (jednorazové vs. opakované)
  if (onlyRecurring && (!event.repeatInterval || event.repeatInterval === 0)) {
    return false;
  }
  if (onlySingle && event.repeatInterval && event.repeatInterval > 0) {
    return false;
  }

  // 7. Kategórie
  const categoriesArray = toArray(categories);
  if (categoriesArray?.length > 0) {
    const eventCategoryIds = event.categories?.map((cat) => cat.id) || [];

    if (allCategories) {
      const allIncluded = categoriesArray.every((id) =>
        eventCategoryIds.includes(parseInt(id))
      );
      if (!allIncluded) {
        return false;
      }
    } else {
      const someIncluded = categoriesArray.some((id) =>
        eventCategoryIds.includes(parseInt(id))
      );
      if (!someIncluded) {
        return false;
      }
    }
  }

  if (filters.myEvents && filters.userId) {
    const userId = filters.userId;

    const isParticipant = event.participants?.some((p) => p.id === userId);

    if (!isParticipant) {
      return false;
    }
  }

  return true; // všetko OK
};

// GET /api/events

export const getAllEvents = async (req, res, next) => {
  try {
    const {
      search,
      searchLocation,
      onlyAvailable,
      categories,
      allCategories,
      onlySingle,
      onlyRecurring,
      daysOfWeek,
      startTime,
      endTime,
      manage,
      myEvents,
    } = req.query;

    const userId = req.user.id;

    const startDate = req.query.startDate
      ? createUTCDate(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? createUTCDate(req.query.endDate) : null;

    const filters = [];

    if (manage && userId) {
      filters.push({
        OR: [
          { organizerId: userId },
          {
            moderators: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      });
    }

    if (myEvents && userId) {
      filters.push({
        OR: [
          {
            eventDays: {
              some: {
                users: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
          {
            eventOccurrences: {
              some: {
                participants: {
                  some: {
                    id: userId,
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (search) {
      filters.push({
        OR: [
          {
            title: { contains: search },
          },
          {
            eventDays: {
              some: {
                eventChange: {
                  title: { contains: search },
                },
              },
            },
          },
          {
            eventOccurrences: {
              some: {
                eventChange: {
                  title: { contains: search },
                },
              },
            },
          },
        ],
      });
    }

    if (searchLocation) {
      filters.push({
        OR: [
          {
            location: { contains: searchLocation },
          },
          {
            eventDays: {
              some: {
                eventChange: {
                  location: { contains: searchLocation },
                },
              },
            },
          },
          {
            eventOccurrences: {
              some: {
                eventChange: {
                  location: { contains: searchLocation },
                },
              },
            },
          },
        ],
      });
    }

    if (onlySingle === "true") {
      filters.push({
        repeatInterval: 0,
      });
    }

    if (onlyRecurring === "true") {
      filters.push({
        NOT: {
          repeatInterval: 0,
        },
      });
    }
    if (startDate || endDate) {
      filters.push({
        OR: [
          {
            // klasická kontrola na hlavný Event
            AND: [
              { startDate: { lte: endDate } }, // event.startDate <= hľadaný endDate
              {
                OR: [
                  { repeatUntil: { gte: startDate } }, // event.repeatUntil >= hľadaný startDate
                  { repeatUntil: null }, // alebo repeatUntil je null (nekonečno)
                ],
              },
            ],
          },
          {
            // navyše kontrola na EventOccurrence.eventChange.startDate
            eventOccurrences: {
              some: {
                eventChange: {
                  startDate: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (daysOfWeek) {
      const parsedDays = Array.isArray(daysOfWeek)
        ? daysOfWeek.map(Number)
        : [Number(daysOfWeek)];

      filters.push({
        OR: [
          {
            eventDays: {
              some: {
                dayId: { in: parsedDays },
              },
            },
          },
          {
            eventOccurrences: {
              some: {
                OR: [
                  {
                    date: {
                      not: null,
                      // Tu sa musíš neskôr na frontende pozerať na day (getUTCDay)
                      // Prisma nemá priamo "dayOfWeek" pre DateTime, takže porovnáš neskôr v JS.
                    },
                  },
                  {
                    eventChange: {
                      startDate: {
                        not: null,
                        // Tiež potom určíš deň v JavaScripte
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    if (categories) {
      const parsedCategories = Array.isArray(categories)
        ? categories.map(Number)
        : [Number(categories)];

      if (parsedCategories.length > 0) {
        if (allCategories === "true") {
          // Musia sedieť všetky vybrané kategórie
          filters.push({
            AND: parsedCategories.map((catId) => ({
              categories: {
                some: {
                  id: catId,
                },
              },
            })),
          });
        } else {
          // Stačí ak sedí aspoň jedna kategória
          filters.push({
            categories: {
              some: {
                id: { in: parsedCategories },
              },
            },
          });
        }
      }
    }

    const allEvents = await prisma.event.findMany({
      where: {
        AND: filters.length > 0 ? filters : undefined,
      },
      include: {
        categories: true,
        eventDays: {
          include: {
            day: true,
            eventChange: true,
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            },
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
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
                profileImageUrl: true,
              },
            },
          },
        },
        eventOccurrences: {
          include: {
            eventChange: true,
            eventDay: { include: { eventChange: true } },
            participants: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    const instances = [];

    for (const event of allEvents) {
      const isRecurring = event.eventDays.length > 0;
      const hasOccurrence = event.eventOccurrences.length > 0;

      for (const occ of event.eventOccurrences) {
        const changedEvent = applyChangesData(
          {
            ...event,
            participants: occ.participants,
            // startDate: mergeDateAndTime(event.startDate, occ.date),
          },
          [occ?.eventChange, occ?.eventDay?.eventChange],
          occ.date
        );

        if (!doesEventMatchFilters(changedEvent, { ...req.query, userId })) {
          continue;
        }

        instances.push({
          ...changedEvent,
          date: occ.date,
          virtual: false,
        });
      }

      if (isRecurring) {
        const virtualEvents = getAllVirtualEvents(event, startDate, endDate);

        for (const event of virtualEvents) {
          const changedEvent = applyChangesData(
            {
              ...event,
              // startDate: mergeDateAndTime(event.startDate, event.date),
            },
            [event?.eventDay?.eventChange],
            event.date
          );
          if (!doesEventMatchFilters(changedEvent, { ...req.query, userId })) {
            continue;
          }
          instances.push(changedEvent);
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
    const message = err.message || "Nepodarilo sa načítať eventy";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
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
      room: true,
    },
  });

  if (!event) throw new AppError("Event not found", 500);

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
    targetDate,
    fieldsToOverride
  );
};

function canJoinEventToday(targetDate, joinDaysBeforeStart) {
  const now = getCurrentUTCDate(); // aktuálny čas (vrátane hodín a minút)
  const eventStart = new Date(targetDate); // plný čas štartu eventu

  // ✅ Základná podmienka: ak event už začal, nesmieš sa prihlásiť
  if (now >= eventStart) {
    return false;
  }

  // ✅ Ak nie je definované, stačí len že ešte event nezačal
  if (!joinDaysBeforeStart) {
    return true;
  }

  // Vypočítaj dátum, od kedy sa môžeš prihlásiť (čas sa ignoruje)
  const joinStartDate = normalizeDate(
    new Date(eventStart.setDate(eventStart.getDate() - joinDaysBeforeStart))
  );

  const todayDateOnly = normalizeDate(now); // vynulovaný čas dnes

  // ✅ Môžeš sa prihlásiť iba ak dnešný dátum je v rozsahu
  return todayDateOnly >= joinStartDate;
}

export const joinEvent = async (req, res, next) => {
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
      throw new AppError("Event neexistuje.", 404);
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
          throw new AppError("Event sa v daný deň nekoná.", 404);
        }

        occurrence = await createOccurrence(
          tx,
          event.id,
          targetDate,
          eventDayId || null
        );
      }

      // 2.2. Skontroluj, či už je používateľ prihlásený
      const alreadyJoined = occurrence.participants.some(
        (p) => p.id === userId
      );
      if (alreadyJoined) {
        throw new AppError("Už si prihlásený na tento event.", 409);
      }

      // 2.3. Skontroluj kapacitu
      if (event.capacity && occurrence.participants.length >= event.capacity) {
        throw new AppError("Kapacita eventu je naplnená.", 409);
      }

      if (!canJoinEventToday(event.startDate, event.joinDaysBeforeStart)) {
        throw new AppError("Neda sa ešte prihlásiť.", 403);
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
      if (event.room.id) {
        await joinRoom(tx, event.room.id, userId);
      }
    });

    return res.json({ message: "Úspešne prihlásený na event." });
  } catch (err) {
    const message = err.message || "Nepodarilo sa prihlásiť na event";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

export const getEventByDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetDate = normalizeDate(req.query.date);

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        categories: true,
        gallery: true,
        room: true,
        eventDays: {
          include: {
            day: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                id: true,
                profileImageUrl: true,
              },
            },
            eventChange: true, // 👈 toto je `eventDayAttendancy`
          },
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
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
                profileImageUrl: true,
              },
            },
          },
        },
        eventOccurrences: {
          where: { date: targetDate },
          include: {
            eventChange: true,
            participants: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true,
              },
            }, // 👈 toto je `occurrenceParticipants`
          },
        },
      },
    });

    const validDate = validateEventDate(event, targetDate);

    if (!validDate) {
      throw new AppError("Event sa v daný deň nekoná.", 400);
    }

    if (!event) throw new AppError("Event neexistuje.", 404);
    const eventDayId = getEventDayId(event, targetDate);
    let eventDay = null;
    if (eventDayId !== null) {
      eventDay = await prisma.eventDay.findUnique({
        where: { id: eventDayId },
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
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
      startDate: mergeDateAndTime(event.startDate, targetDate),
      participants: eventDay?.users || [],
    });
  } catch (err) {
    const message = err.message || "Nepodarilo sa načítať event";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

export const leaveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const targetDate = normalizeDate(req.query.date);

    await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: parseInt(id) },
        include: {
          eventOccurrences: {
            where: { date: targetDate },
          },
          eventDays: true,
        },
      });

      if (!event) {
        throw new Error("Event neexistuje.", 404);
      }

      let occurrence = event.eventOccurrences[0];

      if (!occurrence) {
        // Neexistuje occurrence -> vytvoríme novú, ale exclude usera

        const eventDayId = getEventDayId(event, targetDate); // ak potrebuješ eventDayId (neviem ci máš funkciu getEventDayId)
        occurrence = await createOccurrence(
          tx,
          event.id,
          targetDate,
          eventDayId || null,
          userId // exclude tento userId
        );
      } else {
        if (!canJoinEventToday(event.startDate, event.joinDaysBeforeStart)) {
          throw new AppError("Neda sa este odhlasit", 500);
        }
        // Existuje occurrence -> odhlas usera
        await tx.eventOccurrence.update({
          where: { id: occurrence.id },
          data: {
            participants: {
              disconnect: { id: userId },
            },
          },
        });
      }
    });

    return res.status(200).json({ message: "Úspešne odhlásený z eventu." });
  } catch (err) {
    const message = err.message || "Nepodarilo sa odhlásiť z eventu.";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

export const attendEventDays = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);
    const { eventDayIds } = req.body;

    if (!Array.isArray(eventDayIds)) {
      throw new AppError("Neplatný formát požiadavky.", 400);
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        room: true, // ak máš napríklad `room` ako `@relation` v Event modeli
      },
    });
    if (!event) {
      throw new AppError("Event neexistuje.", 404);
    }

    await prisma.$transaction(async (tx) => {
      const allEventDays = await tx.eventDay.findMany({
        where: { eventId },
        include: {
          users: { select: { id: true } },
          eventChange: true,
        },
      });

      if (event.attendancyLimit) {
        // Zisti, na ktorých dňoch je už pripojený
        const currentlyConnected = allEventDays.filter((ed) =>
          ed.users.some((u) => u.id === userId)
        );

        // Výsledný cieľový stav po zmene bude to, čo je v eventDayIds
        const finalCount = eventDayIds.length;

        // Ale pozor – ak už bol na niektoré z týchto pripojený, nerátajú sa ako nové
        // Limit sa aplikuje na CELKOVÝ počet dní po zmene
        if (finalCount > event.attendancyLimit) {
          throw new AppError(
            `Nemôžeš byť prihlásený na viac ako ${event.attendancyLimit} dní tohto eventu.`,
            409
          );
        }
      }

      const toConnect = eventDayIds;
      const toDisconnect = allEventDays
        .filter(
          (ed) =>
            ed.users.some((u) => u.id === userId) &&
            !eventDayIds.includes(ed.id)
        )
        .map((ed) => ed.id);

      // Skontroluj kapacity pre dni na ktoré sa pripája
      for (const dayId of toConnect) {
        const day = allEventDays.find((d) => d.id === dayId);

        if (!day) {
          throw new AppError(`Deň s ID ${dayId} neexistuje.`, 404);
        }

        const isAlreadyRegistered = day.users.some((u) => u.id === userId);
        const currentCount = day.users.length;

        if (
          !isAlreadyRegistered &&
          event.capacity &&
          currentCount >= (day?.eventChange?.capacity || event.capacity)
        ) {
          throw new AppError(`Kapacita pre deň ${dayId} je naplnená.`, 409);
        }
      }

      // 1. Odpojiť z dní, kde už nemá byť
      await Promise.all(
        toDisconnect.map((dayId) =>
          tx.eventDay.update({
            where: { id: dayId },
            data: {
              users: {
                disconnect: { id: userId },
              },
            },
          })
        )
      );

      // 2. Pripojiť k novým dňom
      await Promise.all(
        toConnect.map((dayId) =>
          tx.eventDay.update({
            where: { id: dayId },
            data: {
              users: {
                connect: { id: userId },
              },
            },
          })
        )
      );

      // 3. Pripojiť používateľa ku všetkým budúcim occurrences na vybrané dni
      const futureOccurrencesToConnect = await tx.eventOccurrence.findMany({
        where: {
          eventDayId: { in: toConnect },
          date: { gte: normalizeDate(getCurrentUTCDate()) },
        },
        select: {
          id: true,
          participants: { select: { id: true } },
          eventDay: {
            select: {
              eventChange: {
                select: {
                  capacity: true,
                },
              },
            },
          },
          eventChange: {
            select: {
              capacity: true,
            },
          },
        },
      });

      await Promise.all(
        futureOccurrencesToConnect.map(async (occ) => {
          const isAlreadyParticipant = occ.participants.some(
            (p) => p.id === userId
          );

          if (isAlreadyParticipant) {
            return; // Už je prihlásený, nič nerob
          }

          // Zisti aká kapacita platí
          const occurrenceCapacity = occ.eventChange?.capacity;
          const eventDayCapacity = occ.eventDay?.eventChange?.capacity;
          const finalCapacity =
            occurrenceCapacity ?? eventDayCapacity ?? event.capacity;

          // Ak máme kapacitu, skontroluj počet
          if (finalCapacity && occ.participants.length >= finalCapacity) {
            // Kapacita je plná, nemôžeme pripojiť
            return;
          }

          // Ak je miesto, pripoj usera
          return tx.eventOccurrence.update({
            where: { id: occ.id },
            data: {
              participants: {
                connect: { id: userId },
              },
            },
          });
        })
      );

      // 4. ODPOJIŤ používateľa zo všetkých budúcich occurrences na dni, z ktorých sa odpojil
      const futureOccurrencesToDisconnect = await tx.eventOccurrence.findMany({
        where: {
          eventDayId: { in: toDisconnect },
          date: { gte: normalizeDate(getCurrentUTCDate()) },
        },
        select: { id: true },
      });

      await Promise.all(
        futureOccurrencesToDisconnect.map((occ) =>
          tx.eventOccurrence.update({
            where: { id: occ.id },
            data: {
              participants: {
                disconnect: { id: userId },
              },
            },
          })
        )
      );

      if (event.room.id) {
        await joinRoom(tx, event.room.id, userId);
      }
    });

    res.json({
      message: "Účasť na dňoch a budúcich eventoch bola aktualizovaná.",
    });
  } catch (err) {
    const message = err.message || "Nepodarilo sa prihlásiť opakované";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

function buildEventChangePayload(
  newDataRaw,
  original,
  computedStartDate,
  computedEndDate
) {
  const newData = {};

  // Kľúče, ktoré musia byť čísla
  const numericKeys = ["capacity", "joinDaysBeforeStart", "attendancyLimit"];

  const setSmart = (key, newValueRaw, originalValue) => {
    if (newValueRaw === undefined) {
      return; // nič nenastavíme
    }

    let newValue = newValueRaw;

    if (numericKeys.includes(key)) {
      if (newValueRaw === "") {
        newValue = 0; // prázdny string na 0 pre čísla
      } else {
        newValue = parseInt(newValueRaw);
      }
    } else if (typeof newValueRaw === "string") {
      newValue = newValueRaw; // ak je normálny string, necháme ako je
    }
    newData[key] = newValue;
  };

  // Spracovanie dátumu
  newData.startDate = computedStartDate;

  newData.endDate = computedEndDate;

  // Ostatné polia
  setSmart("title", newDataRaw.title, original.title);
  setSmart("description", newDataRaw.description, original.description);
  setSmart("location", newDataRaw.location, original.location);
  setSmart("capacity", newDataRaw.capacity, original.capacity);

  setSmart(
    "joinDaysBeforeStart",
    newDataRaw.joinDaysBeforeStart,
    original.joinDaysBeforeStart
  );
  setSmart(
    "attendancyLimit",
    newDataRaw.attendancyLimit,
    original.attendancyLimit
  );

  return newData;
}

async function updateEventImages({
  tx = prisma,
  files,
  mainImageChanged,
  deletedGallery,
  previousMainImage,
  eventId,
}) {
  const deletedImageUrls = [];

  // 1. Ak bol hlavný obrázok zmenený a nový nie je prítomný, nastav null
  if (mainImageChanged && !files?.mainImage?.[0] && previousMainImage) {
    await tx.event.update({
      where: { id: eventId },
      data: { mainImage: null },
    });

    deletedImageUrls.push(previousMainImage);
  }

  // 2. Nastavenie nového hlavného obrázka (ak je)
  if (mainImageChanged && files?.mainImage?.[0]) {
    const mainImageUrl = `/uploads/events/${files.mainImage[0].filename}`;

    await tx.event.update({
      where: { id: eventId },
      data: { mainImage: mainImageUrl },
    });

    if (previousMainImage && previousMainImage !== mainImageUrl) {
      deletedImageUrls.push(previousMainImage);
    }
  }

  // 2.5 Vymazanie galérie – iba tie, ktoré reálne patria eventu
  if (Array.isArray(deletedGallery) && deletedGallery.length > 0) {
    const strippedUrls = deletedGallery.map((fullUrl) => {
      try {
        const url = new URL(fullUrl);
        return url.pathname;
      } catch {
        return fullUrl;
      }
    });

    const existingImages = await tx.eventImage.findMany({
      where: {
        eventId,
        url: { in: strippedUrls },
      },
      select: { url: true },
    });

    const confirmedUrls = existingImages.map((img) => img.url);

    if (confirmedUrls.length > 0) {
      await tx.eventImage.deleteMany({
        where: {
          eventId,
          url: { in: confirmedUrls },
        },
      });

      deletedImageUrls.push(...confirmedUrls);
    }
  }

  // 3. Pridanie novej galérie
  if (files?.gallery?.length) {
    const newGalleryUrls = files.gallery.map(
      (file) => `/uploads/events/${file.filename}`
    );

    await tx.event.update({
      where: { id: eventId },
      data: {
        gallery: {
          create: newGalleryUrls.map((url) => ({ url })),
        },
      },
    });
  }

  // 4. Návrat: všetky cesty obrázkov, ktoré môžeš bezpečne zmazať zo súborového systému
  return deletedImageUrls;
}

export const editEvent = async (req, res, next) => {
  try {
    // validateEventData(req.body, true);
    const parsed = eventEditSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Neplatné dáta",
        errors: parsed.error.flatten(),
      });
    }

    const validated = parsed.data;

    const {
      scope,
      eventDayId,
      title,
      description,
      location,
      repeatUntil,
      repeatDays,
      repeatInterval,
      date,
      startDateTime,
      endDateTime,
      hasStartDate,
      hasStartTime,
      hasEndTime,
      capacity,
      attendancyLimit,
      joinDaysBeforeStart,
      categoryIds,
      deletedGallery: rawGallery,
      mainImageChanged,
      previousMainImage,
    } = validated;

    const eventId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!eventId) {
      throw new AppError("Chýbajúce parametre.", 400);
    }

    // Normalize deletedGallery to just pathnames
    const deletedGallery = (rawGallery || []).map((url) => {
      try {
        const parsed = new URL(url);
        return parsed.pathname;
      } catch {
        return url;
      }
    });

    const targetDate = normalizeDate(date);

    let deletedImageUrls = [];

    // let computedStartDate;
    // let computedEndDate;
    // let hasStartDate = checkValue(startDate);
    // let hasStartTime = checkValue(startTime);
    // let hasEndTime = checkValue(endTime);

    // // Manuálna konštrukcia dátumu v lokálnom čase bez UTC posunu
    // if (hasStartDate || hasStartTime) {
    //   if (hasStartTime) {
    //     computedStartDate = createUTCDate(startDate, startTime);
    //   } else {
    //     computedStartDate = createUTCDate(startDate);
    //   }
    // } else {
    //   computedStartDate = targetDate;
    // }

    // if (hasEndTime && hasStartDate) {
    //   computedEndDate = createUTCDate(startDate, endTime);
    // } else if (hasEndTime) {
    //   computedEndDate = mergeDateAndTime(
    //     createUTCDate(null, endTime),
    //     targetDate
    //   );
    // }
    await prisma.$transaction(async (tx) => {
      if (scope === "event") {
        deletedImageUrls = await updateEventImages({
          tx,
          files: req.files,
          mainImageChanged: mainImageChanged,
          deletedGallery: deletedGallery,
          eventId,
          previousMainImage: previousMainImage,
        });

        const updated = await tx.event.update({
          where: { id: eventId },
          data: {
            title,
            description,
            startDate: startDateTime,
            endDate: endDateTime,
            hasStartDate: undefined,
            hasStartTime,
            hasEndTime,
            location,
            capacity: capacity,
            attendancyLimit: attendancyLimit,
            joinDaysBeforeStart: joinDaysBeforeStart,
            repeatUntil: repeatUntil,
            categories: {
              set: categoryIds.map((id) => ({ id: id })),
            },
          },
        });

        if (repeatDays) {
          const existingDays = await tx.eventDay.findMany({
            where: { eventId },
            include: { day: true },
          });

          const newWeekDayPairs = Object.entries(
            validated.repeatDays || {}
          ).flatMap(([week, days]) =>
            days.map((dayId) => ({
              week: Number(week), // optional: môžeš ponechať aj ako string
              dayId,
            }))
          );

          // Vymaž staré dni + occurrences, ktoré sa na ne viažu
          for (const oldDay of existingDays) {
            const stillExists = newWeekDayPairs.some(
              (pair) =>
                pair.week === oldDay.week && pair.dayId === oldDay.day.id
            );

            if (!stillExists) {
              // Vymaž occurrences naviazané na tento deň
              await tx.eventOccurrence.deleteMany({
                where: { eventDayId: oldDay.id },
              });

              // Vymaž samotný eventDay
              await tx.eventDay.delete({ where: { id: oldDay.id } });
            }
          }

          // Pridaj nové dni, ktoré ešte neexistujú
          for (const pair of newWeekDayPairs) {
            const alreadyExists = existingDays.some(
              (ed) => ed.week === pair.week && ed.day.id === pair.dayId
            );

            if (!alreadyExists) {
              await tx.eventDay.create({
                data: {
                  event: { connect: { id: eventId } },
                  week: pair.week,
                  day: { connect: { id: pair.dayId } },
                },
              });
            }
          }
        }

        // Vytvor nové occurrences podľa aktuálneho stavu
        await createOccurrenceIfNeeded(tx, eventId);

        return res.json({ message: "Úspešne editované" });
      }

      if (scope === "eventDay") {
        if (!eventDayId) {
          throw new AppError("Chýba eventDayId.", 400);
        }

        const eventDay = await tx.eventDay.findUnique({
          where: { id: eventDayId },
          include: {
            event: true,
          },
        });

        if (!eventDay || eventDay.event.id !== eventId) {
          throw new AppError("EventDay neexistuje.", 400);
        }

        const original = eventDay.event;
        const newData = {
          ...buildEventChangePayload(
            req.body,
            original,
            startDateTime,
            endDateTime
          ),
          hasStartDate,
          hasStartTime,
          hasEndTime,
        };

        let change = await tx.eventChange.findFirst({
          where: {
            eventDay: {
              id: eventDayId,
            },
          },
        });

        if (change) {
          change = await tx.eventChange.update({
            where: { id: change.id },
            data: { ...newData, updatedByUser: { connect: { id: userId } } },
          });
        } else {
          change = await tx.eventChange.create({
            data: {
              ...newData,
              eventDay: { connect: { id: eventDayId } },
              createdByUser: { connect: { id: userId } },
            },
          });
        }

        return res.json({ message: "Úspešne editované" });
      }

      if (scope === "occurrence") {
        if (repeatInterval === 0) {
          deletedImageUrls = await updateEventImages({
            tx,
            files: req.files,
            mainImageChanged: mainImageChanged,
            deletedGallery: deletedGallery,
            eventId,
            previousMainImage: previousMainImage,
          });

          await tx.event.update({
            where: { id: eventId },
            data: {
              categories: {
                set: categoryIds.map((id) => ({ id: id })),
              },
            },
          });
        }

        if (!eventId) {
          throw new AppError("Chýba eventId.", 400);
        }
        // Skús nájsť existujúcu occurrence pre daný event a dátum
        let occurrence = await tx.eventOccurrence.findFirst({
          where: {
            eventId: eventId,
            date: date,
          },
          include: {
            event: true,
            eventChange: true,
          },
        });

        // Ak neexistuje, vytvor ju
        if (!occurrence) {
          const event = await tx.event.findUnique({
            where: { id: eventId },
            include: { eventDays: { include: { day: true } } },
          });

          if (!event) {
            throw new AppError("Event neexistuje.", 400);
          }
          const dayExists = event.eventDays.some(
            (eventDay) => eventDay.id === eventDayId
          );

          if (!dayExists) {
            throw new AppError("NEvent day nepatrí k tomuto eventu.", 400);
          }

          // Validácia dátumu (napr. či patrí do cyklu)
          const validDate = getNextEventDate(event, date);
          if (!validDate) {
            throw new AppError("Neplatný dátum pre tento event.", 400);
          }

          occurrence = await createOccurrence(
            tx,
            event.id,
            targetDate,
            eventDayId || null
          );
        }

        const original = occurrence.event;
        const newData = {
          ...buildEventChangePayload(
            req.body,
            original,
            startDateTime,
            endDateTime,
            date
          ),
          hasStartDate,
          hasStartTime,
          hasEndTime,
        };

        if (Object.keys(newData).length === 0) {
          return res
            .status(200)
            .json({ message: "Žiadne zmeny neboli zistené." });
        }

        if (occurrence.eventChangeId) {
          const updatedChange = await tx.eventChange.update({
            where: { id: occurrence.eventChangeId },
            data: { ...newData, updatedByUser: { connect: { id: userId } } },
          });
          return res.json({ message: "Úspešne editované" });
        } else {
          const newChange = await tx.eventChange.create({
            data: { ...newData, createdByUser: { connect: { id: userId } } },
          });

          await tx.eventOccurrence.update({
            where: { id: occurrence.id },
            data: { eventChangeId: newChange.id },
          });

          return res.json({ message: "Úspešne editované" });
        }
      }
      throw new AppError("Neznámy scope", 400);
    });
    try {
      for (const relPath of deletedImageUrls) {
        const absPath = path.join(".", relPath);
        fs.unlink(absPath).catch((err) => {
          console.warn("⚠️ Nepodarilo sa zmazať:", absPath, err.message);
        });
      }
    } catch {}
  } catch (err) {
    console.warn(err);

    // ⚠️ Automatické mazanie súborov z req.files (v prípade chyby)
    try {
      if (req.files) {
        const allFiles = [
          ...(Array.isArray(req.files.gallery) ? req.files.gallery : []),
          ...(Array.isArray(req.files.mainImage) ? req.files.mainImage : []),
        ];

        for (const file of allFiles) {
          const absPath = file.path;
          fs.unlink(absPath).catch((e) => {
            console.warn(
              "⚠️ Nepodarilo sa zmazať dočasný súbor:",
              absPath,
              e.message
            );
          });
        }
      }
    } catch {}

    return next(err);
  }
};

export const updateEventModerators = async (req, res, next) => {
  const moderators = req.body;
  const { id: eventIdParam } = req.params;
  const eventId = parseInt(eventIdParam, 10);

  if (!eventId || !Array.isArray(moderators)) {
    return res
      .status(400)
      .json({ error: "Missing eventId or moderators array" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Získaj všetkých aktuálnych moderátorov eventu
      const existing = await tx.eventModerator.findMany({
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
            return tx.eventModerator.update({
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
            return tx.eventModerator.create({
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

      await tx.eventModerator.deleteMany({
        where: { id: { in: toDelete } },
      });
    });

    res.status(200).json({ message: "Updated" });
  } catch (error) {
    console.warn(err);
    return next(error);
  }
};

export const deleteRecurringAttendance = async (req, res, next) => {
  try {
    const parsed = deleteRecurringAttendanceParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Neplatné parametre URL", 400, parsed.error.flatten());
    }

    const { eventDayId, userId } = parsed.data; // už sú to čísla

    await prisma.eventDay.update({
      where: { id: eventDayId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
    });

    res
      .status(200)
      .json({ message: "User removed from recurring attendance." });
  } catch (err) {
    const message = err.message || "Nepodarilo sa odstrániť opakovanú účasť.";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

export const deleteSingleAttendance = async (req, res, next) => {
  try {
    const parsed = deleteSingleAttendanceParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError("Neplatné parametre URL", 400, parsed.error.flatten());
    }

    const { occurrenceId, userId } = parsed.data; // už čísla

    await prisma.eventOccurrence.update({
      where: { id: occurrenceId },
      data: {
        participants: {
          disconnect: { id: userId },
        },
      },
    });

    res.status(200).json({ message: "Používateľ odstránený z dochádzky" });
  } catch (err) {
    const message = err.message || "Nepodarilo sa odstrániť účasť.";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Neplatné ID eventu." });
  }

  try {
    // 1. Skontrolujeme, či Event existuje
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      throw new AppError("Event nebol nájdený.", 404);
    }

    // 2. Vymažeme Event
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ message: "Event bol úspešne vymazaný." });
  } catch (err) {
    const message = err.message || "Chyba pri mazaní eventu.";
    const status = err.statusCode || 500;
    console.warn(err);
    return next(err);
  }
};
