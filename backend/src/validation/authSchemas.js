import { z } from "zod";

export const RegisterSchema = z.object({
  firstName: z.string().min(1, "Meno je povinné"),
  lastName: z.string().min(1, "Priezvisko je povinné"),
  email: z
    .string()
    .email("Neplatný email")
    .endsWith("uniza.sk", "Použi školský email"),
  password: z.string().min(8, "Heslo musí mať aspoň 8 znakov"),
});
