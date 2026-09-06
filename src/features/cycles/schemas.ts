import { z } from "zod";

export const cycleFormSchema = z.object({
  organizationId: z.uuid(),
  year: z.coerce
    .number({ error: "Ingresa un año válido." })
    .int("El año debe ser un número entero.")
    .min(2000, "El año debe ser 2000 o mayor.")
    .max(2200, "El año debe ser 2200 o menor."),
  cycleNumber: z.coerce
    .number({ error: "Ingresa un ciclo válido." })
    .int("El ciclo debe ser un número entero.")
    .min(1, "El ciclo debe estar entre 1 y 19.")
    .max(19, "El ciclo debe estar entre 1 y 19."),
});
