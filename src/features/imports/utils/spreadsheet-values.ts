const EDGE_SPREADSHEET_WHITESPACE = /^[ \t\r\n ]+|[ \t\r\n ]+$/g;

/**
 * Normalizes a raw spreadsheet cell into text: trims edge whitespace and
 * treats blank strings and the common "no value" placeholder "-" as null.
 * Never trusts an Excel value directly (per project convention) — this is
 * the shared first step before any Zod validation.
 */
export function normalizeCellText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).replace(EDGE_SPREADSHEET_WHITESPACE, "");
  return text === "" || text === "-" ? null : text;
}

/** Same as normalizeCellText, but coerces to a finite number or null. */
export function normalizeCellNumber(value: unknown): number | null {
  const text = normalizeCellText(value);
  if (text === null) {
    return null;
  }

  const parsed = Number(text.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Same as normalizeCellNumber, truncated to an integer. */
export function normalizeCellInteger(value: unknown): number | null {
  const parsed = normalizeCellNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

/**
 * Accepts the two date shapes observed in Vonatur's source reports —
 * `YYYY-MM-DD` and `DD/MM/YYYY` — and normalizes both to `YYYY-MM-DD` for
 * PostgreSQL `date` columns. Anything else is treated as unparseable.
 */
export function normalizeCellDate(value: unknown): string | null {
  const text = normalizeCellText(value);
  if (text === null) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}
