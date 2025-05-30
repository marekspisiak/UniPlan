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

export const createOccurrenceIfNeeded = async (tx, eventId) => {
  const event = await tx.event.findUnique({
    where: { id: eventId },
    include: {
      eventDays: {
        include: { day: true },
      },
    },
  });

  if (!event) return null;

  return await createOccurrenceIfNeededFromEvent(tx, event);
};

export const createOccurrenceIfNeededFromEvent = async (tx, event) => {
  const nextDate = getNextEventDate(event);
  const eventDayId = getEventDayId(event);

  const occurrence = await tx.eventOccurrence.findFirst({
    where: {
      eventId: event.id,
      date: nextDate,
    },
  });

  if (!occurrence) {
    return await createOccurrence(
      tx,
      event.id,
      normalizeDate(nextDate || event.startDate),
      eventDayId || null
    );
  }

  return null;
};

export async function createOccurrence(
  tx,
  eventId,
  date,
  eventDayId = null,
  excludeUserId = null
) {
  try {
    // 1. Vytvoríme nový occurrence
    const newOccurrence = await tx.eventOccurrence.create({
      data: {
        eventId,
        eventDayId: eventDayId,
        date,
      },
      include: {
        participants: {
          select: { id: true },
        },
        event: true,
      },
    });

    // 2. Ak máme eventDayId, hľadáme userov a pripájame ich
    if (eventDayId) {
      const users = await tx.user.findMany({
        where: {
          joinedAttendancies: {
            some: { id: eventDayId },
          },
          ...(excludeUserId && {
            NOT: { id: excludeUserId },
          }),
        },
        select: { id: true },
      });
      if (users.length > 0) {
        const updatedOccurrence = await tx.eventOccurrence.update({
          where: { id: newOccurrence.id },
          data: {
            participants: {
              connect: users.map((user) => ({ id: user.id })),
            },
          },
          include: {
            participants: {
              select: { id: true },
            },
            event: true,
          },
        });

        return updatedOccurrence;
      }
    }
    return newOccurrence;
  } catch (error) {
    console.error("Failed to create occurrence:", error);
    throw error;
  }
}
