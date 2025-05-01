import { z } from "zod";

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Názov je povinný"),
    description: z.string().optional(),

    startDate: z.string().min(1, "Dátum je povinný"),

    startTime: z.string().optional(),
    endTime: z.string().optional(),

    repeat: z.boolean(),
    repeatUntil: z.string().optional(),
    repeatInterval: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Musí byť celé číslo")
          .gt(0, "Interval musí byť väčší ako 0"),
      ])
      .optional(),

    allowRecurringAttendance: z.boolean().optional(),

    maxAttendancesPerCycle: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Musí byť celé číslo")
          .gt(0, "Počet účastí musí byť väčší ako 0"),
      ])
      .optional(),

    location: z.string().optional(),

    capacity: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Musí byť celé číslo")
          .gt(0, "Kapacita musí byť väčšia ako 0"),
      ])
      .optional(),

    joinDaysBeforeStart: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Musí byť celé číslo")
          .gt(0, "Musí byť väčšie ako 0"),
      ])
      .optional(),

    categoryIds: z.array(z.number()).optional(),
    moderators: z.array(z.any()).optional(),

    mainImage: z.any().optional(),
    gallery: z.any().optional(),
    deletedGallery: z.any().optional(),

    repeatDays: z.record(z.array(z.number())).optional(),
  })
  .superRefine((data, ctx) => {
    const today = new Date().toISOString().split("T")[0]; // dnešný dátum v "YYYY-MM-DD"

    // ✅ Čas začiatku je povinný pri repeat
    if (data.repeat && !data.startTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Čas začiatku je povinný pri opakovaní.",
      });
    }

    // ✅ Ak je zadaný endTime, musí byť aj startTime
    if (data.endTime && !data.startTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Zadaj aj čas začiatku, ak si zadal čas konca.",
      });
    }

    // ✅ Ak sú oba časy, startTime < endTime
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Čas začiatku musí byť pred časom konca.",
      });
      ctx.addIssue({
        path: ["endTime"],
        code: "custom",
        message: "Čas konca musí byť po čase začiatku.",
      });
    }

    // ✅ repeatUntil musí byť po dnešnom aj po startDate
    if (data.repeatUntil) {
      if (data.repeatUntil <= today) {
        ctx.addIssue({
          path: ["repeatUntil"],
          code: "custom",
          message: "Dátum opakovania musí byť neskôr ako dnešný.",
        });
      }
      if (data.startDate && data.repeatUntil <= data.startDate) {
        ctx.addIssue({
          path: ["repeatUntil"],
          code: "custom",
          message: "Dátum opakovania musí byť po dátume začiatku.",
        });
      }
    }
  });

const utcDateString = () =>
  z
    .string()
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?Z$/.test(val),
      { message: "Musí byť platný UTC ISO dátum (napr. 2025-05-01T12:00:00Z)" }
    );

const zResolvedIntFromFormData = z.preprocess((val) => {
  if (val === "") return 0;
  if (val === undefined) return undefined;
  return parseInt(val);
}, z.number().optional());

export const eventEditSchema = z
  .object({
    scope: z.enum(["event", "eventDay", "occurrence"]),
    occurrenceId: z.coerce.number().optional().nullable(),
    eventDayId: z.coerce
      .number()
      .min(0, { message: "EventDayId nemôže byť záporné." })
      .optional(),

    title: z.string().max(80, "Názov môže mať najviac 100 znakov").optional(),
    description: z
      .string()
      .max(700, "Popis môže mať najviac 1000 znakov")
      .optional(),
    location: z
      .string()
      .max(120, "Miesto môže mať najviac 255 znakov")
      .optional(),

    repeatUntil: utcDateString().nullable().optional(),
    repeatInterval: z.coerce
      .number()
      .min(0, { message: "Interval musí byť 0 alebo viac." })
      .optional()
      .nullable(),

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

    date: utcDateString().optional(),
    startDateTime: utcDateString().nullable().optional(),
    endDateTime: utcDateString().nullable().optional(),

    hasStartTime: z.preprocess((val) => val === "true", z.boolean().optional()),
    hasEndTime: z.preprocess((val) => val === "true", z.boolean().optional()),
    hasStartDate: z.preprocess((val) => val === "true", z.boolean().optional()),

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
  .refine(
    (data) => {
      if (data.startDateTime && data.endDateTime) {
        return new Date(data.startDateTime) < new Date(data.endDateTime);
      }
      return true;
    },
    {
      message: "StartDateTime musí byť pred EndDateTime",
      path: ["startDateTime"],
    }
  )
  .refine(
    (data) => {
      if (data.startDateTime && data.repeatUntil) {
        return new Date(data.startDateTime) <= new Date(data.repeatUntil);
      }
      return true;
    },
    {
      message: "RepeatUntil musí byť po StartDateTime",
      path: ["repeatUntil"],
    }
  );
