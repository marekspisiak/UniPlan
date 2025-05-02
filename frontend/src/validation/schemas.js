import { z } from "zod";
// 🔁 Reuse: školský email validátor
const schoolEmail = z
  .string()
  .max(254, "Email je príliš dlhý (max. 254 znakov)")
  .email("Neplatný email")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return domain === "uniza.sk" || domain.endsWith(".uniza.sk");
    },
    { message: "Použi školský email (uniza.sk)" }
  );

// 🔐 Reuse: heslo validátor bezpečný pre bcrypt
const passwordField = z
  .string()
  .min(8, "Heslo musí mať aspoň 8 znakov")
  .max(72, "Heslo môže mať maximálne 72 znakov");

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, "Meno je povinné")
    .max(50, "Maximálna dĺžka mena je 50 znakov"),
  lastName: z
    .string()
    .min(1, "Priezvisko je povinné")
    .max(70, "Maximálna dĺžka priezviska je 70 znakov"),
  email: schoolEmail,
  password: passwordField,
});

export const loginSchema = z.object({
  email: schoolEmail,
  password: passwordField,
});

export const getEditProfileSchema = (originalEmail) =>
  z
    .object({
      firstName: z
        .string()
        .min(1, "Meno je povinné")
        .max(50, "Maximálna dĺžka mena je 50 znakov"),
      lastName: z
        .string()
        .min(1, "Priezvisko je povinné")
        .max(70, "Maximálna dĺžka priezviska je 70 znakov"),
      email: schoolEmail,
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Zadaj aktuálne heslo"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Potvrď nové heslo"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Nové heslá sa nezhodujú.",
  });

// validation/eventSchema.js

export const eventFormSchema = z
  .object({
    title: z.string().max(80, "Názov môže mať najviac 80 znakov").optional(),
    description: z
      .string()
      .max(700, "Popis môže mať najviac 700 znakov")
      .optional(),
    location: z
      .string()
      .max(120, "Miesto môže mať najviac 120 znakov")
      .optional(),

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
    const today = new Date().toISOString().split("T")[0];
    if (
      data.repeat &&
      (data.repeatInterval <= 0 || data.repeatInterval === "")
    ) {
      ctx.addIssue({
        path: ["repeatInterval"],
        code: "custom",
        message: "Interval opakovania musi byt aspon 1.",
      });
    }

    if (data.repeat && !data.startTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Čas začiatku je povinný pri opakovaní.",
      });
    }

    if (data.endTime && !data.startTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Zadaj aj čas začiatku, ak si zadal čas konca.",
      });
    }

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

export const recommendationsFilterSchema = z
  .object({
    search: z
      .string()
      .max(80, "Hľadaný text môže mať najviac 80 znakov")
      .optional(),
    searchLocation: z
      .string()
      .max(120, "Miesto môže mať najviac 120 znakov")
      .optional(),
    onlyAvailable: z.boolean(),
    onlyRecommended: z.boolean(),
    useMyInterests: z.boolean(),
    selectedCategories: z.array(z.number()),
    allCategories: z.boolean(),
    onlySingle: z.boolean(),
    onlyRecurring: z.boolean(),
    manage: z.boolean(),
    myEvents: z.boolean(),
    startDate: z.string().min(1, "Dátum je povinný"),
    endDate: z.string().min(1, "Dátum je povinný"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    daysOfWeek: z.array(z.number()),
  })
  .superRefine((data, ctx) => {
    // Dátumová kontrola
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        path: ["startDate"],
        code: "custom",
        message: "Dátum začiatku nemôže byť po dátume konca.",
      });
    }

    // Časová kontrola
    if (data.startTime && data.endTime && data.startTime > data.endTime) {
      ctx.addIssue({
        path: ["startTime"],
        code: "custom",
        message: "Čas začiatku nemôže byť po čase konca.",
      });
    }
  });
