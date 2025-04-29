import e from "express";
import prisma from "../../prisma/client.js";
import path from "path";
import fs from "fs"; // a ak ešte nemáš, aj fs budeš potrebovať
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

function validateEventData(
  {
    startDate,
    startTime,
    endTime,
    repeatUntil,
    repeatInterval,
    maxAttendancesPerCycle,
    capacity,
    joinDaysBeforeStart,
  },
  editing
) {
  if (!editing && isEmpty(startDate)) {
    throw new Error("startDate je povinný pri vytváraní.");
  }

  const startDateObj = createUTCDate(startDate);

  if (startTime && endTime && startTime > endTime) {
    throw new Error("Čas konca musí byť po Čas začiatku.");
  }
  if (
    repeatUntil &&
    !isEmpty(repeatUntil) &&
    new Date(repeatUntil) < startDateObj
  ) {
    throw new Error("Opakovať do nemôže byť pred startDate.");
  }

  if (!isEmpty(repeatInterval) && repeatInterval < 0) {
    throw new Error("Interval opakovania musí byť 0 alebo väčší.");
  }

  if (
    !isEmpty(maxAttendancesPerCycle) &&
    (isNaN(maxAttendancesPerCycle) || Number(maxAttendancesPerCycle) < 1)
  ) {
    throw new Error(
      "Max počet dní pre pravidelné prihlásenie na jeden cyklus musí byť prázdne alebo aspoň 1."
    );
  }

  if (!isEmpty(capacity) && (isNaN(capacity) || Number(capacity) < 1)) {
    throw new Error("Kapacita musí byť prázdne alebo aspoň 1.");
  }

  if (
    !isEmpty(joinDaysBeforeStart) &&
    (isNaN(joinDaysBeforeStart) || Number(joinDaysBeforeStart) < 1)
  ) {
    throw new Error(
      "Koľko dní pred začiatkom sa možno prihlásiť musí byť prázdne alebo aspoň 1."
    );
  }
}

export const createEvent = async (req, res) => {
  try {
    validateEventData(req.body);
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

    const newEvent = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
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
        req.user.id, // organizátor
        ...moderators.map((mod) => mod.id), // všetci moderátori
      ];

      // A každého pripojíš do room
      for (const userId of allUserIds) {
        await joinRoom(tx, roomId, userId);
      }

      if (repeatDays) {
        const parsedRepeatDays = JSON.parse(repeatDays);

        for (const [week, days] of Object.entries(parsedRepeatDays)) {
          for (const id of days) {
            await tx.eventDay.create({
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
      return newEvent;
    });

    await createOccurrenceIfNeeded(newEvent.id);

    res.status(201).json({ id: newEvent.id });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Nepodarilo sa updatovať vytvoriť event." });
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

export const getAllEvents = async (req, res) => {
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
        eventDays: { include: { day: true, eventChange: true, users: true } },
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

    const instances = [];

    for (const event of allEvents) {
      const isRecurring = event.eventDays.length > 0;
      const hasOccurrence = event.eventOccurrences.length > 0;

      for (const occ of event.eventOccurrences) {
        const changedEvent = applyChangesData(
          {
            ...event,
            participants: occ.participants,
            startDate: mergeDateAndTime(event.startDate, occ.date),
          },
          [occ?.eventChange, occ?.eventDay?.eventChange]
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
              startDate: mergeDateAndTime(event.startDate, event.date),
            },
            [event?.eventDay?.eventChange]
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
    return res.status(500).json({ message: "Nepodarilo sa načítať eventy" });
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
      if (event.room.id) {
        await joinRoom(tx, event.room.id, userId);
      }
    });

    return res.json({ message: "Úspešne prihlásený na event." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Nepodarilo sa prihlásiť na event" });
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
        room: true,
        eventDays: {
          include: {
            day: true,
            users: true,
            eventChange: true, // 👈 toto je `eventDayAttendancy`
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
      startDate: mergeDateAndTime(event.startDate, targetDate),
      participants: eventDay?.users || [],
    });
  } catch (err) {
    return res.status(500).json({ message: "Nepodarilo sa načítať event" });
  }
};

export const leaveEvent = async (req, res) => {
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
        throw new Error("Event neexistuje.");
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
          throw new Error("Neda sa este odhlasit");
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
    return res
      .status(500)
      .json({ message: "Nepodarilo sa odhlásiť z eventu." });
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        room: true, // ak máš napríklad `room` ako `@relation` v Event modeli
      },
    });
    if (!event) {
      return res.status(404).json({ message: "Event neexistuje." });
    }

    await prisma.$transaction(async (tx) => {
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

      // Skontroluj kapacity pre dni na ktoré sa pripája
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
    return res
      .status(500)
      .json({ message: "Nepodarilo sa prihlásiť na event." });
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
  const numericKeys = [
    "capacity",
    "joinDaysBeforeStart",
    "allowRecurringAttendance",
  ];

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

  if (newDataRaw.endTime) {
    newData.endDate = computedEndDate;
  }

  // Ostatné polia
  setSmart("title", newDataRaw.title, original.title);
  setSmart("description", newDataRaw.description, original.description);
  setSmart("location", newDataRaw.location, original.location);

  setSmart(
    "capacity",
    newDataRaw.capacity !== undefined
      ? parseInt(newDataRaw.capacity)
      : undefined,
    original.capacity
  );

  setSmart(
    "joinDaysBeforeStart",
    newDataRaw.joinDaysBeforeStart !== undefined
      ? parseInt(newDataRaw.joinDaysBeforeStart)
      : undefined,
    original.joinDaysBeforeStart
  );

  setSmart(
    "allowRecurringAttendance",
    typeof newDataRaw.allowRecurringAttendance === "boolean"
      ? newDataRaw.allowRecurringAttendance
      : undefined,
    original.allowRecurringAttendance
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

    await tx.event.update({
      where: { id: eventId },
      data: { mainImage: null },
    });
  }

  // 2. Nastavenie nového hlavného obrázka (ak je)
  if (mainImageChanged && files?.mainImage?.[0]) {
    const mainImageUrl = `/uploads/events/${files.mainImage[0].filename}`;
    await tx.event.update({
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
    await tx.eventImage.deleteMany({
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

    await tx.event.update({
      where: { id: eventId },
      data: {
        gallery: {
          create: newGalleryUrls.map((url) => ({ url })),
        },
      },
    });
  }
}

const resolveInt = (value) => {
  if (value === "") {
    return 0;
  }
  if (value === undefined) {
    return value;
  }
  return parseInt(value);
};

export const editEvent = async (req, res) => {
  try {
    // validateEventData(req.body, true);
    const { scope, occurrenceId } = req.body;
    const userId = req.user.id;
    const eventId = parseInt(req.params.id);
    const targetDate = normalizeDate(req.body.date);

    const eventDayId = parseInt(req.body.eventDayId);

    if (!eventId || !scope) {
      return res.status(400).json({ message: "Chýbajúce parametre." });
    }

    const {
      title,
      description,
      startDate,
      location,
      allowRecurringAttendance,
      repeatUntil,
      repeatDays,
      startTime,
      endTime,
      repeatInterval,
    } = req.body;

    const capacity = resolveInt(req.body.capacity);
    const attendancyLimit = resolveInt(req.body.attendancyLimit);

    const joinDaysBeforeStart = resolveInt(req.body.joinDaysBeforeStart);

    const categoryIds = toArray(req.body?.categoryIds);

    const rawGallery = req.body?.deletedGallery;

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

    function checkValue(value) {
      if (value === undefined) return undefined;
      return value === "" ? false : true;
    }

    let computedStartDate;
    let computedEndDate;
    let hasStartDate = checkValue(startDate);
    let hasStartTime = checkValue(startTime);
    let hasEndTime = checkValue(endTime);

    // Manuálna konštrukcia dátumu v lokálnom čase bez UTC posunu
    if (hasStartDate || hasStartTime) {
      if (hasStartTime) {
        computedStartDate = createUTCDate(startDate, startTime);
      } else {
        computedStartDate = createUTCDate(startDate);
      }
    } else {
      computedStartDate = targetDate;
    }

    if (hasEndTime && hasStartDate) {
      computedEndDate = createUTCDate(startDate, endTime);
    } else if (hasEndTime) {
      computedEndDate = mergeDateAndTime(
        createUTCDate(null, endTime),
        targetDate
      );
    }

    await prisma.$transaction(async (tx) => {
      if (scope === "event") {
        await updateEventImages({
          tx,
          files: req.files,
          mainImageChanged: req.body.mainImageChanged === "true",
          deletedGallery: deletedGallery,
          eventId,
          previousMainImage: req.body.previousMainImage || null,
        });

        const updated = await tx.event.update({
          where: { id: eventId },
          data: {
            title,
            description,
            startDate: computedStartDate,
            endDate: computedEndDate,
            hasStartDate: undefined,
            hasStartTime,
            hasEndTime,
            location,
            capacity: parseInt(capacity),
            attendancyLimit: parseInt(attendancyLimit),
            allowRecurringAttendance: allowRecurringAttendance === "true",
            joinDaysBeforeStart: parseInt(joinDaysBeforeStart),
            repeatUntil: !isEmpty(repeatUntil)
              ? createUTCDate(repeatUntil)
              : null,
            categories: {
              set: categoryIds.map((id) => ({ id: parseInt(id) })),
            },
          },
        });

        if (repeatDays) {
          // Spracovanie repeatDaysif
          const parsedRepeatDays = JSON.parse(repeatDays || "{}");

          const existingDays = await tx.eventDay.findMany({
            where: { eventId },
            include: { day: true },
          });

          const newWeekDayPairs = Object.entries(parsedRepeatDays).flatMap(
            ([week, days]) =>
              days.map((day) => ({
                week: parseInt(week),
                dayId: parseInt(day),
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
        await createOccurrenceIfNeeded(eventId);

        return res.json({ message: "Úspešne editované" });
      }

      if (scope === "eventDay") {
        if (!eventDayId) {
          return res.status(400).json({ message: "Chýba eventDayId." });
        }

        const eventDay = await tx.eventDay.findUnique({
          where: { id: eventDayId },
          include: {
            event: true,
          },
        });

        if (!eventDay || eventDay.event.id !== eventId) {
          return res.status(404).json({ message: "EventDay neexistuje." });
        }

        const original = eventDay.event;
        const newData = {
          ...buildEventChangePayload(
            req.body,
            original,
            computedStartDate,
            computedEndDate
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
        if (parseInt(repeatInterval) === 0) {
          await updateEventImages({
            tx,
            files: req.files,
            mainImageChanged: req.body.mainImageChanged === "true",
            deletedGallery: deletedGallery,
            eventId,
            previousMainImage: req.body.previousMainImage || null,
          });

          await tx.event.update({
            where: { id: eventId },
            data: {
              categories: {
                set: categoryIds.map((id) => ({ id: parseInt(id) })),
              },
            },
          });
        }

        if (!eventId || !computedStartDate) {
          return res
            .status(400)
            .json({ message: "Chýba eventId alebo dátum." });
        }
        // Skús nájsť existujúcu occurrence pre daný event a dátum
        let occurrence = await tx.eventOccurrence.findFirst({
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
          const event = await tx.event.findUnique({
            where: { id: parseInt(eventId) },
            include: { eventDays: { include: { day: true } } },
          });

          if (!event) {
            return res.status(404).json({ message: "Event neexistuje." });
          }
          const dayExists = event.eventDays.some(
            (eventDay) => eventDay.id === eventDayId
          );

          if (!dayExists) {
            return res
              .status(400)
              .json({ message: "Event day nepatrí k tomuto eventu." });
          }

          // Validácia dátumu (napr. či patrí do cyklu)
          const validDate = getNextEventDate(event, req.body.date);
          if (!validDate) {
            return res
              .status(400)
              .json({ message: "Neplatný dátum pre tento event." });
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
            computedStartDate,
            computedEndDate,
            req.body.date
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
      return res.status(400).json({ message: "Neznámy scope." });
    });
  } catch (err) {
    return res.status(500).json({ message: "Nepodarilo sa editovať event." });
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

    res.status(200).json("Updated");
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Nepodarilo sa updatovať  moderatorov." });
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
    return res
      .status(500)
      .json({ message: "Nepodarilo sa updatovať vymazat opakovane" });
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
    return res
      .status(500)
      .json({ message: "Nepodarilo sa updatovať vymazat." });
  }
};

export const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Skontrolujeme, či Event existuje
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    });

    if (!event) {
      return res.status(404).json({ message: "Event nebol nájdený." });
    }

    // 2. Vymažeme Event
    await prisma.event.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({ message: "Event bol úspešne vymazaný." });
  } catch (error) {
    return res.status(500).json({ message: "Chyba pri mazaní eventu." });
  }
};
