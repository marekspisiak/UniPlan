import prisma from "../../prisma/client.js";
import { getCurrentUTCDate } from "./dateHelpers.js";

import {
  getEventDayId,
  getNextEventDate,
  normalizeDate,
} from "./virtualizationHelpers.js";

export const shouldCreateOccurrence = (event, nextDate) => {
  const isRecurring = event.eventDays && event.eventDays.length > 0;
  const hasDate = event.hasStartDate;
  const hasTime = event.hasStartTime;

  if (isRecurring) {
    if (!hasDate || !hasTime || !nextDate) return false;
    return true;
  } else {
    if (!hasDate && !hasTime) return true;
    if (!hasDate && hasTime) return true;
    if (hasDate && hasTime) return true;
    if (hasDate) return true;
    return false;
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
      date: {
        gt: getCurrentUTCDate(), // len ak je dátum v budúcnosti
      },
    },
    orderBy: {
      date: "asc", // nájde najbližší budúci výskyt
    },
  });

  const nextDate = getNextEventDate(event);
  const eventDayId = getEventDayId(event);
  console.log("nextDate", nextDate);

  if (!existing && shouldCreateOccurrence(event, nextDate)) {
    const occurrenceData = {
      event: { connect: { id: event.id } },
      date: normalizeDate(nextDate || event.startDate),
    };

    if (eventDayId) {
      occurrenceData.eventDay = { connect: { id: eventDayId } };
    }
    return await prisma.eventOccurrence.create({
      data: occurrenceData,
    });
  }

  return null;
};
