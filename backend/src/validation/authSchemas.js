import { z } from "zod";

export const RegisterSchema = z.object({
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
