export const resolveEventData = (data, scope = null) => {
  const fieldsToOverride = [
    "title",
    "description",
    "startDate",
    "endDate",
    "location",
    "capacity",
    "joinDaysBeforeStart",
    "hasStartDate",
    "hasStartTime",
    "hasEndTime",
  ];

  let sources = [];

  if (scope === "occurrence") {
    sources = ["eventChange", "eventChangeDay", "event"];
  } else if (scope === "eventDay") {
    sources = ["eventChangeDay", "event"];
  } else if (scope === "event") {
    sources = ["event"];
  } else {
    // ak scope nie je špecifikovaný, použijeme všetko
    sources = ["eventChange", "eventChangeDay", "event"];
  }

  const resolved = {};

  for (const key of fieldsToOverride) {
    for (const source of sources) {
      const sourceData = data[source];
      if (sourceData?.[key] !== undefined && sourceData?.[key] !== null) {
        resolved[key] = sourceData[key];
        break;
      }
    }
  }

  return resolved;
};
