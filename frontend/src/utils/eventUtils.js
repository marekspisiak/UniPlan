import { createUTCDate } from "./dateUtils";

export const resolveEventData = (event, scope = null) => {
  const fieldsToOverride = [
    "title",
    "description",
    "location",
    "capacity",
    "joinDaysBeforeStart",
    "allowRecurringAttendance",
    "hasEndTime",
    "hasStartDate",
    "hasStartTime",
  ];

  let sources = [];

  if (scope === "occurrence") {
    sources = ["eventChange", "eventChangeDay"];
  } else if (scope === "eventDay") {
    sources = ["eventChangeDay"];
  } else {
    // ak scope nie je špecifikovaný, použijeme všetko
    sources = ["eventChange", "eventChangeDay"];
  }

  const result = {};
  result.startDate = new Date(event.startDate).toISOString().slice(0, 10);

  result.startTime = event.hasStartTime
    ? new Date(event.startDate).toISOString().slice(11, 16)
    : "";

  result.endTime = event.hasEndTime
    ? new Date(event.endDate).toISOString().slice(11, 16)
    : "";

  if (scope === "event") {
    return result;
  }

  for (const key of fieldsToOverride) {
    for (const sourceKey of sources) {
      const data = event?.[sourceKey];

      console.log(result.startDate);

      if (data?.[key] != null) {
        console.log(data[key]);
        console.log(key);
        if (key === "hasStartTime" && data[key]) {
          result.startTime = new Date(data.startDate)
            .toISOString()
            .slice(11, 16);
        } else if (key === "hasEndTime" && data[key]) {
          result.endTime = new Date(data.endDate).toISOString().slice(11, 16);
        } else if (key === "hasStartDate" && data[key]) {
          result.startDate = new Date(data.startDate)
            .toISOString()
            .slice(0, 10);
        }
        result[key] = data[key];

        break;
      }
    }
  }

  console.log(result);

  return result;
};

export function isEmpty(value) {
  return (
    value === null ||
    value === "null" ||
    value === undefined ||
    value === "undefined" ||
    value === ""
  );
}
