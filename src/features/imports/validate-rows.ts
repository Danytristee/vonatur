import "server-only";

import type { z } from "zod";

import type { ParsedSheetRow } from "./parse-workbook";

export type RowError = {
  rowNumber: number;
  message: string;
};

export type ValidateRowsResult<T> = {
  valid: T[];
  errors: RowError[];
};

/**
 * Validates every parsed row against its Zod schema. Row numbers are
 * 1-indexed and account for the header row, so they match what the user
 * sees when they open the spreadsheet (first data row is row 2).
 */
export function validateRows<T>(
  rows: ParsedSheetRow[],
  schema: z.ZodType<T>,
): ValidateRowsResult<T> {
  const valid: T[] = [];
  const errors: RowError[] = [];

  rows.forEach((row, index) => {
    const parsed = schema.safeParse(row);

    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      errors.push({
        rowNumber: index + 2,
        message: parsed.error.issues[0]?.message ?? "Fila inválida.",
      });
    }
  });

  return { valid, errors };
}
