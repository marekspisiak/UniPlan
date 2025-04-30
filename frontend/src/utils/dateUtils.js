export const formatDateUTC = (date) => {
  return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
};

export const formatTimeUTC = (date) => {
  return new Date(date).toISOString().slice(11, 16); // HH:MM
};

export const combineDateTimeUTC = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
};

export const createUTCDate = (dateString, timeString) => {
  let year, month, day;

  if (dateString) {
    [year, month, day] = dateString.split("-").map(Number);
  } else {
    const today = getCurrentUTCDate();
    year = today.getUTCFullYear();
    month = today.getUTCMonth() + 1;
    day = today.getUTCDate();
  }

  if (timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes));
  } else {
    return new Date(Date.UTC(year, month - 1, day));
  }
};

export const formatDateSlovak = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");
  return `${parseInt(day)}. ${parseInt(month)}. ${year}`;
};

export const getCurrentUTCDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const timestamp = Date.UTC(year, month, day, hours, minutes, seconds);
  return new Date(timestamp);
};

export function toUTCZeroTime(dateInput) {
  const date = new Date(dateInput);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

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

export const getTodayLocalDate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset(); // v minútach
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};
