import { createUTCDate, getCurrentUTCDate } from "./dateHelpers.js";
import { isAfter, isEqual } from "date-fns";
import { applyChangesData } from "./helpers.js";

export const normalizeDate = (date) => {
  // Ak je null alebo undefined, vráť null
  if (!date) {
    return null;
  }

  // Ak je string, parsuj
  if (typeof date === "string") {
    if (date.trim() === "" || date === "undefined") {
      return null;
    }

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      return null;
    }

    date = parsed;
  }

  // Ak je objekt typu Date
  if (date instanceof Date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const finalDate = new Date(Date.UTC(year, month, day));
    return finalDate;
  }

  // Iné typy
  return null;
};

export const getCustomStartOfWeek = (date) => {
  const jsDate = new Date(date);
  const day = jsDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
  jsDate.setUTCDate(jsDate.getUTCDate() + diff);
  jsDate.setUTCHours(0, 0, 0, 0);
  return jsDate;
};

//vrati mi offset od zaciatku cyklu do danej udalosti

export const getStartCycleOffset = (
  event,
  targetDate = getCurrentUTCDate()
) => {
  if (!event.startDate) return null;
  const start = getCustomStartOfWeek(normalizeDate(event.startDate));
  const target = normalizeDate(targetDate);

  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
  const weeksSinceStart = Math.floor(diffDays / 7);

  const startCycleOffset =
    Math.floor(weeksSinceStart / (event.repeatInterval || 1)) *
    (event.repeatInterval || 1);

  return startCycleOffset;
};

export const isSameOrAfter = (a, b) => isAfter(a, b) || isEqual(a, b);

export const getVirtualDates = (
  event,
  targetDate = getCurrentUTCDate(),
  onCandidate
) => {
  if (!event.startDate) return null;
  //wweekoffset je offset od zaciatku cyklu do danej udalosti
  const weekOffset = getStartCycleOffset(event, targetDate);

  //ziska maximalný počet týždňov do konca opakovania
  const repeatUntil = event.repeatUntil ? new Date(event.repeatUntil) : null;
  const now = getCurrentUTCDate();
  const maxWeeks = repeatUntil
    ? Math.ceil(
        (repeatUntil.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
      ) + 1
    : 52;

  const baseDate = getCustomStartOfWeek(event.startDate);

  for (let i = weekOffset; i < maxWeeks; i += event.repeatInterval || 1) {
    for (const day of event.eventDays || []) {
      const candidate = new Date(baseDate);
      candidate.setUTCDate(
        candidate.getUTCDate() + 7 * (i + day.week) + (day.day.id - 1)
      );
      candidate.setUTCHours(0, 0, 0, 0);
      if (isSameOrAfter(candidate, targetDate)) {
        const result = onCandidate(candidate, day.id, day.eventChange);
        if (result === "break") return;
      }
    }
  }
};

export const getNextEventDate = (event, targetDate = getCurrentUTCDate()) => {
  const target = normalizeDate(targetDate);
  const start = normalizeDate(event.startDate);

  if (isEqual(start, target) && event.repeatInterval == 0) return target;

  if (!event.startDate) return null;

  let nextEventDate;
  getVirtualDates(event, target, (date) => {
    if (isSameOrAfter(date, target)) {
      nextEventDate = date;
      return "break"; // Stop the loop when the first valid date is found
    }
  });
  return nextEventDate;
};

export const getEventDayId = (event, targetDate = getCurrentUTCDate()) => {
  const target = normalizeDate(targetDate);
  let eventDayId = null;
  getVirtualDates(event, target, (date, dayId) => {
    if (isSameOrAfter(date, target)) {
      eventDayId = dayId;
      return "break"; // Stop the loop when the first valid date is found
    }
  });
  return eventDayId;
};

export const validateEventDate = (event, targetDate) => {
  if (isEqual(normalizeDate(event.startDate), normalizeDate(targetDate)))
    return true;
  if (!event.startDate) return null;
  const target = normalizeDate(targetDate);
  let result = false;
  getVirtualDates(event, target, (date) => {
    if (isEqual(date, target)) {
      result = true;
      return "break"; // Stop the loop when the first valid date is found
    }
  });
  return result;
};

export const getAllVirtualDates = (event, now = getCurrentUTCDate()) => {
  const dates = [];
  const existingDates = new Set(
    event.eventOccurrences.map((occ) => new Date(occ.date).toISOString())
  );
  getVirtualDates(event, now, (candidate) => {
    if (!existingDates.has(candidate.toISOString())) {
      dates.push(candidate);
    }
  });
  return dates;
};

export const getAllVirtualEvents = (event, now = getCurrentUTCDate()) => {
  const dates = [];
  const existingDates = new Set(
    event.eventOccurrences.map((occ) => new Date(occ.date).toISOString())
  );
  getVirtualDates(event, now, (candidate, dayId, dayChanges) => {
    if (!existingDates.has(candidate.toISOString())) {
      const changedEvent = applyChangesData(event, [dayChanges]);
      dates.push({ ...changedEvent, date: candidate, virtual: true });
    }
  });
  return dates;
};
