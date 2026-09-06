import "server-only";

import * as XLSX from "xlsx";

import { normalizeHeader } from "./utils/normalize-header";

export type ParsedSheetRow = Record<string, unknown>;

export type ParseWorkbookResult = {
  rows: ParsedSheetRow[];
  missingColumns: string[];
};

/**
 * Reads the first sheet of an uploaded workbook, maps each column to its
 * internal field name via `headerMap` (ignoring columns the business doesn't
 * use yet), and reports which required canonical headers were not found.
 *
 * `raw: false` reads each cell as SheetJS's formatted display text rather
 * than its raw numeric/date value — required so `external_code` keeps
 * leading zeros. Every other field is re-coerced to its real type by the
 * Zod row schema that consumes this result.
 */
export function parseWorkbookRows(
  buffer: Buffer,
  headerMap: Record<string, string>,
  requiredCanonicalHeaders: readonly string[],
): ParseWorkbookResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], missingColumns: [...requiredCanonicalHeaders] };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: null,
  });

  const foundHeaders = new Set<string>();
  const rows = rawRows.map((rawRow) => {
    const mapped: ParsedSheetRow = {};

    for (const [rawHeader, value] of Object.entries(rawRow)) {
      const normalized = normalizeHeader(rawHeader);
      foundHeaders.add(normalized);

      const field = headerMap[normalized];
      if (field) {
        mapped[field] = value;
      }
    }

    return mapped;
  });

  const missingColumns = requiredCanonicalHeaders.filter(
    (header) => !foundHeaders.has(normalizeHeader(header)),
  );

  return { rows, missingColumns };
}
