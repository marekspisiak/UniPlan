export const preprocessFormData = (body) => ({
  ...body,
  repeat: body.repeat === "true",
  repeatInterval: body.repeatInterval ? Number(body.repeatInterval) : null,
  maxAttendancesPerCycle: body.maxAttendancesPerCycle
    ? Number(body.maxAttendancesPerCycle)
    : null,
  allowRecurringAttendance: body.allowRecurringAttendance === "true",
  joinDaysBeforeStart: body.joinDaysBeforeStart
    ? Number(body.joinDaysBeforeStart)
    : null,
  categoryIds: body.categoryIds ? JSON.parse(body.categoryIds) : [],
  moderators: body.moderators ? JSON.parse(body.moderators) : [],
});
