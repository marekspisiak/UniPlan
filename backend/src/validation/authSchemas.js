import { z } from "zod";

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

const passwordField = z
  .string()
  .min(8, "Heslo musí mať aspoň 8 znakov")
  .max(72, "Heslo môže mať maximálne 72 znakov");

export const RegisterSchema = z.object({
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
