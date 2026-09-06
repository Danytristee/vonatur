/**
 * Normalizes an Excel header for matching against a canonical column map:
 * trims, collapses internal whitespace, strips accents and case-folds to
 * upper case. The canonical source header text itself is never altered —
 * only this normalized copy is used to look up the internal field name.
 */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
