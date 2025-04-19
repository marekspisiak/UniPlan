import { createUTCDate, getCurrentUTCDate } from "./dateHelpers.js";
import { isAfter, isEqual } from "date-fns";

export const normalizeDate = (date) => {
  const isoString =
    typeof date === "string" ? date : new Date(date).toISOString();
  const [year, month, day] = isoString.split("T")[0].split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
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

  console.log("maxWeeks", maxWeeks);
  console.log("repeatInterval", event.repeatInterval);

  const baseDate = getCustomStartOfWeek(event.startDate);

  for (let i = weekOffset; i < maxWeeks; i += event.repeatInterval || 1) {
    console.log("i", i);
    for (const day of event.eventDays || []) {
      const candidate = new Date(baseDate);
      candidate.setUTCDate(
        candidate.getUTCDate() + 7 * (i + day.week) + (day.day.id - 1)
      );
      candidate.setUTCHours(0, 0, 0, 0);
      console.log("candidate", candidate.toISOString());
      console.log("target", targetDate.toISOString());
      console.log(isSameOrAfter(candidate, targetDate));
      if (isSameOrAfter(candidate, targetDate)) {
        const result = onCandidate(candidate);
        if (result === "break") return;
      }
    }
  }
};

export const getNextEventDate = (event, targetDate = getCurrentUTCDate()) => {
  if (!event.startDate) return null;
  const target = normalizeDate(targetDate);
  let nextEventDate;
  getVirtualDates(event, target, (date) => {
    if (isSameOrAfter(date, target)) {
      nextEventDate = date;
      return "break"; // Stop the loop when the first valid date is found
    }
  });
  return nextEventDate;
};

export const validateEventDate = (event, targetDate) => {
  if (!event.startDate) return null;
  const target = normalizeDate(targetDate);
  let result = false;
  getVirtualDates(event, target, (date) => {
    result = isEqual(date, target);
    return "break";
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
