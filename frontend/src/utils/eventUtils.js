import { createUTCDate, mergeDateAndTime } from "./dateUtils";

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
    "startDate",
    "endDate",
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

  const result = { ...event };

  if (scope !== "event") {
    for (const key of fieldsToOverride) {
      for (const sourceKey of sources) {
        const data = event?.[sourceKey];

        console.log(result.startDate);

        if (data?.[key] != null) {
          result[key] = data[key];

          break;
        }
      }
    }
  }

  result.startTime = result?.hasStartTime
    ? result.startDate.split("T")[1]?.substring(0, 5)
    : "";
  result.endTime =
    result?.hasEndTime && result.endDate
      ? result.endDate.split("T")[1]?.substring(0, 5)
      : "";
  result.startDate = result?.hasStartDate ? result.startDate.split("T")[0] : "";

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

export function fixNumbers(value) {
  if (
    value === null ||
    value === "null" ||
    value === undefined ||
    value === "undefined" ||
    value === "" ||
    value === 0 ||
    value === "0"
  ) {
    return "";
  }
  return value;
}
