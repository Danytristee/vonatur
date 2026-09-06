import { z } from "zod";

import { normalizeExternalCode } from "./utils/normalize-external-code";
import {
  normalizeCellDate,
  normalizeCellInteger,
  normalizeCellNumber,
  normalizeCellText,
} from "./utils/spreadsheet-values";

function requiredExternalCode(value: unknown, ctx: z.RefinementCtx) {
  try {
    return normalizeExternalCode(value);
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Falta el código de consultora.",
    });
    return z.NEVER;
  }
}

export const channelExtractRowSchema = z.object({
  external_code: z.unknown().transform(requiredExternalCode),
  full_name: z.unknown().transform(normalizeCellText),
  status: z.unknown().transform(normalizeCellText),
  level: z.unknown().transform(normalizeCellText),
  accumulated_points: z.unknown().transform(normalizeCellNumber),
  phone: z.unknown().transform(normalizeCellText),
  district: z.unknown().transform(normalizeCellText),
});

export type ChannelExtractRow = z.infer<typeof channelExtractRowSchema>;

export const debtReportRowSchema = z.object({
  external_code: z.unknown().transform(requiredExternalCode),
  full_name: z.unknown().transform(normalizeCellText),
  phone: z.unknown().transform(normalizeCellText),
  commercial_status: z.unknown().transform(normalizeCellText),
  level: z.unknown().transform(normalizeCellText),
  title_value: z.unknown().transform(normalizeCellNumber),
  principal_balance: z.unknown().transform(normalizeCellNumber),
  current_balance: z.unknown().transform(normalizeCellNumber),
  situation: z.unknown().transform(normalizeCellText),
  maturity_status: z.unknown().transform(normalizeCellText),
  acquisition_cycle: z.unknown().transform(normalizeCellText),
  due_date: z.unknown().transform(normalizeCellDate),
  days_overdue: z.unknown().transform(normalizeCellInteger),
});

export type DebtReportRow = z.infer<typeof debtReportRowSchema>;
