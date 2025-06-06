import { z } from "zod";

// export const editEventFormSchema = z
//   .object({
//     title: z.string().min(1, "Názov je povinný"),
//     description: z.string().optional(),

//     startDate: z.string().min(1, "Dátum je povinný"),

//     startTime: z.string().optional(),
//     endTime: z.string().optional(),

//     repeat: z.boolean(),
//     repeatUntil: z.string().optional(),
//     repeatInterval: z
//       .union([
//         z.literal(""),
//         z.coerce
//           .number()
//           .int("Musí byť celé číslo")
//           .gt(0, "Interval musí byť väčší ako 0"),
//       ])
//       .optional(),

//     allowRecurringAttendance: z.boolean().optional(),

//     location: z.string().optional(),

//     capacity: z
//       .union([
//         z.literal(""),
//         z.coerce
//           .number()
//           .int("Musí byť celé číslo")
//           .gt(0, "Kapacita musí byť väčšia ako 0"),
//       ])
//       .optional(),

//     joinDaysBeforeStart: z
//       .union([
//         z.literal(""),
//         z.coerce
//           .number()
//           .int("Musí byť celé číslo")
//           .gt(0, "Musí byť väčšie ako 0"),
//       ])
//       .optional(),

//     categoryIds: z.array(z.number()).optional(),

//     mainImage: z.any().optional(),
//     gallery: z.any().optional(),
//     deletedGallery: z.any().optional(),
//   })
//   .superRefine((data, ctx) => {
//     const today = new Date().toISOString().split("T")[0]; // dnešný dátum v "YYYY-MM-DD"

//     // ✅ Čas začiatku je povinný pri repeat
//     if (data.repeat && !data.startTime) {
//       ctx.addIssue({
//         path: ["startTime"],
//         code: "custom",
//         message: "Čas začiatku je povinný pri opakovaní.",
//       });
//     }

//     // ✅ Ak je zadaný endTime, musí byť aj startTime
//     if (data.endTime && !data.startTime) {
//       ctx.addIssue({
//         path: ["startTime"],
//         code: "custom",
//         message: "Zadaj aj čas začiatku, ak si zadal čas konca.",
//       });
//     }

//     // ✅ Ak sú oba časy, startTime < endTime
//     if (data.startTime && data.endTime && data.startTime >= data.endTime) {
//       ctx.addIssue({
//         path: ["startTime"],
//         code: "custom",
//         message: "Čas začiatku musí byť pred časom konca.",
//       });
//       ctx.addIssue({
//         path: ["endTime"],
//         code: "custom",
//         message: "Čas konca musí byť po čase začiatku.",
//       });
//     }

//     // ✅ repeatUntil musí byť po dnešnom aj po startDate
//     if (data.repeatUntil) {
//       if (data.repeatUntil <= today) {
//         ctx.addIssue({
//           path: ["repeatUntil"],
//           code: "custom",
//           message: "Dátum opakovania musí byť neskôr ako dnešný.",
//         });
//       }
//       if (data.startDate && data.repeatUntil <= data.startDate) {
//         ctx.addIssue({
//           path: ["repeatUntil"],
//           code: "custom",
//           message: "Dátum opakovania musí byť po dátume začiatku.",
//         });
//       }
//     }
//   });

const utcDateString = () =>
  z
    .string()
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z$/.test(val),
      { message: "Musí byť platný UTC ISO dátum (napr. 2025-05-01T12:00:00Z)" }
    );
const zBooleanFromFormData = () =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return val; // fallback – ak príde niečo iné
  }, z.boolean().optional());
const zResolvedIntFromFormData = z.preprocess((val) => {
  if (val === "") return 0;
  if (val === undefined) return undefined;
  return parseInt(val);
}, z.number().optional());

export const baseEventFormSchema = z.object({
  title: z
    .string()
    .min(1, "Názov nesmie byť prázdny")
    .max(80, "Názov môže mať najviac 80 znakov")
    .optional(),
  description: z
    .string()
    .max(700, "Popis môže mať najviac 700 znakov")
    .optional(),
  location: z
    .string()
    .max(120, "Miesto môže mať najviac 120 znakov")
    .optional(),

  repeatUntil: utcDateString().nullable().optional(),
  repeatInterval: z.coerce.number().min(0).optional().nullable(),

  repeatDays: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    }
    return val;
  }, z.record(z.string(), z.array(z.coerce.number())).optional()),

  startDateTime: utcDateString().nullable().optional(),
  endDateTime: utcDateString().nullable().optional(),

  hasStartTime: zBooleanFromFormData(),
  hasEndTime: zBooleanFromFormData(),
  hasStartDate: zBooleanFromFormData(),

  capacity: zResolvedIntFromFormData.refine(
    (val) => val === undefined || val >= 0,
    {
      message: "Kapacita nemôže byť záporná.",
    }
  ),
  attendancyLimit: zResolvedIntFromFormData.refine(
    (val) => val === undefined || val >= 0,
    {
      message: "Limit účastí nemôže byť záporný.",
    }
  ),
  joinDaysBeforeStart: zResolvedIntFromFormData.refine(
    (val) => val === undefined || val >= 0,
    {
      message: "Počet dní pred začiatkom nemôže byť záporný.",
    }
  ),

  categoryIds: z.preprocess((val) => {
    if (typeof val === "string") return [parseInt(val)];
    if (Array.isArray(val)) return val.map((v) => parseInt(v));
    return [];
  }, z.array(z.number()).optional()),
});

const baseEventValidation = (data, ctx) => {
  if (data.startDateTime && data.endDateTime) {
    if (new Date(data.startDateTime) >= new Date(data.endDateTime)) {
      ctx.addIssue({
        path: ["startDateTime"],
        code: "custom",
        message: "StartDateTime musí byť pred EndDateTime",
      });
    }
  }

  if (data.startDateTime && data.repeatUntil) {
    if (new Date(data.startDateTime) > new Date(data.repeatUntil)) {
      ctx.addIssue({
        path: ["repeatUntil"],
        code: "custom",
        message: "RepeatUntil musí byť po StartDateTime",
      });
    }
  }
};

export const eventCreateSchema = baseEventFormSchema
  .extend({
    repeat: zBooleanFromFormData(),
    allowRecurringAttendance: zBooleanFromFormData(),
    maxAttendancesPerCycle: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Musí byť celé číslo")
          .gt(0, "Počet účastí musí byť väčší ako 0"),
      ])
      .optional(),
    moderators: z.preprocess((val) => {
      if (Array.isArray(val)) {
        return val
          .map((mod) => {
            try {
              return JSON.parse(mod);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
      return [];
    }, z.array(z.any()).optional()),
  })
  .superRefine((data, ctx) => {
    baseEventValidation(data, ctx);
    if (data.repeat && !data.hasStartTime) {
      ctx.addIssue({
        path: ["hasStartTime"],
        code: "custom",
        message: "Pri opakovaní musí byť zadaný čas začiatku.",
      });
    }
  });

export const eventEditSchema = baseEventFormSchema
  .extend({
    scope: z.enum(["event", "eventDay", "occurrence"]),
    occurrenceId: z.coerce.number().optional().nullable(),
    eventDayId: z.coerce
      .number()
      .min(0, { message: "EventDayId nemôže byť záporné." })
      .optional(),

    date: utcDateString(),

    deletedGallery: z.preprocess((val) => {
      if (typeof val === "string") return val.split(",").map((s) => s.trim());
      if (Array.isArray(val)) {
        return val.flatMap((entry) => entry.split(",").map((s) => s.trim()));
      }
      return [];
    }, z.array(z.string()).optional()),

    mainImageChanged: z.preprocess(
      (val) => val === "true",
      z.boolean().optional()
    ),
    previousMainImage: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // ✅ Ak je scope = "eventDay", eventDayId je povinné
    baseEventValidation(data, ctx);
    if (
      data.scope === "eventDay" &&
      (data.eventDayId === undefined || data.eventDayId === null)
    ) {
      ctx.addIssue({
        path: ["eventDayId"],
        code: "custom",
        message: "EventDayId je povinné, keď je scope 'eventDay'.",
      });
    }

    // ✅ Ak je scope = "event", niektoré polia musia byť neprázdne
    if (data.scope === "event") {
      if (!data.hasStartTime && data.startDateTime) {
        ctx.addIssue({
          path: ["hasStartTime"],
          code: "custom",
          message: "Musí byť zapnutý čas začiatku pri úprave celého eventu.",
        });
      }

      if (data.startDateTime === null) {
        ctx.addIssue({
          path: ["startDateTime"],
          code: "custom",
          message:
            "Začiatok eventu (startDateTime) je povinný pri scope 'event'.",
        });
      }

      if (data.capacity !== undefined && data.capacity <= 0) {
        ctx.addIssue({
          path: ["capacity"],
          code: "custom",
          message: "Kapacita musí byť väčšia ako 0 pri scope 'event'.",
        });
      }

      if (data.attendancyLimit !== undefined && data.attendancyLimit <= 0) {
        ctx.addIssue({
          path: ["attendancyLimit"],
          code: "custom",
          message: "Limit účastí musí byť väčší ako 0 pri scope 'event'.",
        });
      }

      if (
        data.joinDaysBeforeStart !== undefined &&
        data.joinDaysBeforeStart <= 0
      ) {
        ctx.addIssue({
          path: ["joinDaysBeforeStart"],
          code: "custom",
          message:
            "Počet dní pred začiatkom musí byť väčší ako 0 pri scope 'event'.",
        });
      }
    }
  });

export const deleteSingleAttendanceParamsSchema = z.object({
  id: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
  occurrenceId: z.preprocess(
    (val) => parseInt(val),
    z.number().int().nonnegative()
  ),
  userId: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
});

export const deleteRecurringAttendanceParamsSchema = z.object({
  id: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
  eventDayId: z.preprocess(
    (val) => parseInt(val),
    z.number().int().nonnegative()
  ),
  userId: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
});
