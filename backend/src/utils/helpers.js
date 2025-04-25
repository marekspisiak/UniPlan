export const toArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

export const applyChangesData = (
  event,
  changeSources = [],
  fieldsToOverride = [
    "title",
    "description",
    "startDate",
    "endDate",
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

  for (const field of fieldsToOverride) {
    // Hľadá zmeny podľa priority zdrojov
    let overrideFound = false;

    for (const source of changeSources) {
      if (source?.[field] != null) {
        result[field] = source[field];
        overrideFound = true;
        break;
      }
    }

    if (!overrideFound && overrideDefaults[field] !== undefined) {
      result[field] = overrideDefaults[field];
    }
  }

  return result;
};
