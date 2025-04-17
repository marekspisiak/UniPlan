import {
  startOfWeek,
  addWeeks,
  setDay,
  isAfter,
  isBefore,
  isEqual,
} from "date-fns";
import prisma from "../../prisma/client.js"; // uprav podľa projektu

export const getNextEventDate = (event) => {
  const now = new Date();
  const eventDays = event.eventDays || [];

  let closestDate = null;

  for (const day of eventDays) {
    const weekOffset = day.week || 0;
    const dayId = day.day.id; // toto je 1 (pondelok) až 7 (nedeľa)

    // `setDay` používa 0 (nedeľa) až 6 (sobota), takže to musíme premapovať:
    const targetDay = dayId % 7; // 1->1, ..., 7->0

    const baseDate = startOfWeek(now, { weekStartsOn: 1 });
    const candidate = setDay(addWeeks(baseDate, weekOffset), targetDay, {
      weekStartsOn: 1,
    });

    if (isAfter(candidate, now) || isEqual(candidate, now)) {
      if (!closestDate || isBefore(candidate, closestDate)) {
        closestDate = candidate;
      }
    }
  }

  return closestDate;
};

export const shouldCreateOccurrence = (event) => {
  const now = new Date();

  if (!event.eventDays || event.eventDays.length === 0) {
    const joinableFrom = new Date(event.startDate);
    joinableFrom.setDate(joinableFrom.getDate() - event.joinDaysBeforeStart);
    return now >= joinableFrom;
  } else {
    const nextDate = getNextEventDate(event);
    if (!nextDate) return false;

    const joinableFrom = new Date(nextDate);
    joinableFrom.setDate(joinableFrom.getDate() - event.joinDaysBeforeStart);

    return now >= joinableFrom;
  }
};

export const createOccurrenceIfNeeded = async (eventId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventDays: {
        include: { day: true },
      },
    },
  });

  if (!event) return null;

  const existing = await prisma.eventOccurrence.findFirst({
    where: {
      eventId: event.id,
      eventChangeId: null,
    },
  });

  if (!existing && shouldCreateOccurrence(event)) {
    return await prisma.eventOccurrence.create({
      data: {
        event: { connect: { id: event.id } },
      },
    });
  }

  return null;
};
