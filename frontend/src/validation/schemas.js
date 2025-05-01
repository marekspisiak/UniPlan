import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(1, "Meno je povinné"),
  lastName: z.string().min(1, "Priezvisko je povinné"),
  email: z
    .string()
    .email("Neplatný email")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return domain === "uniza.sk" || domain?.endsWith(".uniza.sk");
      },
      {
        message: "Použi školský email (uniza.sk)",
      }
    ),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Neplatný email")
    .refine(
      (email) => {
        const domain = email.split("@")[1]?.toLowerCase();
        return domain === "uniza.sk" || domain?.endsWith(".uniza.sk");
      },
      {
        message: "Použi školský email (uniza.sk)",
      }
    ),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov"),
});

// validation/eventSchema.js

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Názov je povinný"),
    description: z.string().optional(),
    mainImageChanged: z.boolean().optional(),

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

    attendancyLimit: z
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

export const getEditProfileSchema = (originalEmail) =>
  z
    .object({
      firstName: z.string().min(1, "Meno je povinné"),
      lastName: z.string().min(1, "Priezvisko je povinné"),
      email: z
        .string()
        .email("Neplatný email")
        .refine(
          (email) => {
            const domain = email.split("@")[1]?.toLowerCase();
            return domain === "uniza.sk" || domain?.endsWith(".uniza.sk");
          },
          {
            message: "Použi školský email (uniza.sk)",
          }
        ),
      confirmEmail: z.string().optional(),
      interests: z.array(z.number()),
      mainImage: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.email !== originalEmail && data.email !== data.confirmEmail) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmEmail"],
          message: "Email a potvrdenie emailu sa nezhodujú.",
        });
      }
    });
