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
