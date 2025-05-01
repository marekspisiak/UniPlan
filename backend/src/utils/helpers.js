import { createUTCDate, mergeDateAndTime } from "./dateHelpers.js";

export const toArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

export const applyChangesData = (
  event,
  changeSources = [],

  date,
  fieldsToOverride = [
    "title",
    "description",
    "location",
    "capacity",
    "joinDaysBeforeStart",
    "hasEndTime",
    "hasStartDate",
    "hasStartTime",
    "startDate",
    "endDate",
  ]
) => {
  const result = { ...event };
  // let startDate = new Date(event.startDate).toISOString().slice(0, 10);
  // let startTime =
  //   event.hasStartTime && new Date(event.startDate).toISOString().slice(11, 16);
  // let endTime =
  //   event.hasEndTime && new Date(event.endDate).toISOString().slice(11, 16);
  let dateChanged = false;

  for (const field of fieldsToOverride) {
    // Hľadá zmeny podľa priority zdrojov
    let overrideFound = false;

    for (const source of changeSources) {
      if (source?.[field] != null) {
        // if (field === "hasStartTime" && source[field]) {
        //   startTime = new Date(source.startDate).toISOString().slice(11, 16);
        // } else if (field === "hasEndTime" && source[field]) {
        //   endTime = new Date(source.endDate).toISOString().slice(11, 16);
        // } else if (field === "hasStartDate" && source[field]) {
        //   startDate = new Date(source.startDate).toISOString().slice(0, 10);
        // }
        result[field] = source[field];
        if (field === "startDate") {
          dateChanged = true;
        }

        overrideFound = true;
        break;
      }
    }
    if (!dateChanged) {
      result.startDate = mergeDateAndTime(event.startDate, date);
      if (event.endDate) {
        result.endDate = mergeDateAndTime(event.endDate, date);
      }
    }
  }

  // result.startDate = createUTCDate(startDate, startTime);
  // if (result.hasEndTime) {
  //   result.endDate = createUTCDate(startDate, endTime);
  // }

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
