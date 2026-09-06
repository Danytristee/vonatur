import { z } from "zod";

import { normalizeExternalCode } from "../imports/utils/normalize-external-code";

function optionalText(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
}

export const contactFormSchema = z.object({
  organizationId: z.uuid(),
  externalCode: z
    .unknown()
    .transform((value, ctx) => {
      try {
        return normalizeExternalCode(value);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa el código de consultora.",
        });
        return z.NEVER;
      }
    }),
  fullName: z.unknown().transform(optionalText),
  phone: z.unknown().transform(optionalText),
  currentStatus: z.unknown().transform(optionalText),
  currentLevel: z.unknown().transform(optionalText),
  district: z.unknown().transform(optionalText),
});

export const contactUpdateFormSchema = contactFormSchema
  .omit({
    externalCode: true,
  })
  .extend({
  contactId: z.uuid(),
});
