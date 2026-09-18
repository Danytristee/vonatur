import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido." }),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string({ error: "Ingresa una contraseña." })
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string({ error: "Confirma la contraseña." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });
