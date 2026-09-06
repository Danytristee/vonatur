const EDGE_SPREADSHEET_WHITESPACE = /^[ \t\r\n\u00A0]+|[ \t\r\n\u00A0]+$/g;

/**
 * Normalizes the external consultant code before it reaches the database.
 *
 * Important for the future SheetJS parser: read this value as formatted text
 * (`raw: false` / cell `.w`) when possible. If Excel exposes `00123` as a
 * numeric raw value, the leading zeros are already lost before this function runs.
 */
export function normalizeExternalCode(value: unknown): string {
  if (value === null || value === undefined) {
    throw new Error("external_code is required");
  }

  const normalized = String(value).replace(EDGE_SPREADSHEET_WHITESPACE, "");

  if (normalized === "") {
    throw new Error("external_code is required");
  }

  return normalized;
}
