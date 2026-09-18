import { z } from "zod";

export const noteFormSchema = z.object({
  organizationId: z.uuid(),
  contactId: z.uuid(),
  body: z
    .string({ error: "Escribe una nota." })
    .trim()
    .min(1, "La nota no puede estar vacía.")
    .max(2000, "La nota es demasiado larga."),
});

export const deleteNoteSchema = z.object({
  organizationId: z.uuid(),
  noteId: z.uuid(),
});
