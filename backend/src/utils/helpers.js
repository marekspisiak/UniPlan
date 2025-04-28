import { createUTCDate } from "./dateHelpers.js";

export const toArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

export const applyChangesData = (
  event,
  changeSources = [],
  fieldsToOverride = [
    "title",
    "description",
    "location",
    "capacity",
    "joinDaysBeforeStart",
    "allowRecurringAttendance",
    "hasEndTime",
    "hasStartDate",
    "hasStartTime",
  ],
  overrideDefaults = {}
) => {
  const result = { ...event };
  let startDate = new Date(event.startDate).toISOString().slice(0, 10);
  let startTime =
    event.hasStartTime && new Date(event.startDate).toISOString().slice(11, 16);
  let endTime =
    event.hasEndTime && new Date(event.endDate).toISOString().slice(11, 16);

  for (const field of fieldsToOverride) {
    // Hľadá zmeny podľa priority zdrojov
    let overrideFound = false;

    for (const source of changeSources) {
      if (source?.[field] != null) {
        if (field === "hasStartTime" && source[field]) {
          startTime = new Date(source.startDate).toISOString().slice(11, 16);
        } else if (field === "hasEndTime" && source[field]) {
          endTime = new Date(source.endDate).toISOString().slice(11, 16);
        } else if (field === "hasStartDate" && source[field]) {
          startDate = new Date(source.startDate).toISOString().slice(0, 10);
        }
        result[field] = source[field];

        overrideFound = true;
        break;
      }
    }

    if (!overrideFound && overrideDefaults[field] !== undefined) {
      result[field] = overrideDefaults[field];
    }
  }

  result.startDate = createUTCDate(startDate, startTime);
  if (result.hasEndTime) {
    result.endDate = createUTCDate(startDate, endTime);
  }

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
