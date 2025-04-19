export const createUTCDate = (dateString, timeString) => {
  let year, month, day;

  console.log(dateString, timeString);

  if (dateString) {
    [year, month, day] = dateString.split("-").map(Number);
  } else {
    const today = new Date();
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

const getMondayOfWeekUTC = (date) => {
  const day = date.getUTCDay(); // 0 (nedeľa) až 6 (sobota)
  const diff = (day + 6) % 7; // počet dní dozadu do pondelka
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  monday.setUTCDate(monday.getUTCDate() - diff);
  return monday;
};
