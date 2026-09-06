import { describe, expect, it } from "vitest";

import {
  normalizeCellDate,
  normalizeCellInteger,
  normalizeCellNumber,
  normalizeCellText,
} from "./spreadsheet-values";

describe("normalizeCellText", () => {
  it("treats null, blank and the dash placeholder as null", () => {
    expect(normalizeCellText(null)).toBeNull();
    expect(normalizeCellText(undefined)).toBeNull();
    expect(normalizeCellText("")).toBeNull();
    expect(normalizeCellText("-")).toBeNull();
    expect(normalizeCellText("   ")).toBeNull();
  });

  it("trims edge whitespace but keeps internal content", () => {
    expect(normalizeCellText("  Activa  ")).toBe("Activa");
  });
});

describe("normalizeCellNumber", () => {
  it("parses a decimal balance", () => {
    expect(normalizeCellNumber("175.74")).toBe(175.74);
  });

  it("treats the dash placeholder (e.g. PUNTOS ACUMULADOS) as null, not NaN", () => {
    expect(normalizeCellNumber("-")).toBeNull();
  });

  it("returns null for unparseable text", () => {
    expect(normalizeCellNumber("N/A")).toBeNull();
  });
});

describe("normalizeCellInteger", () => {
  it("truncates a decimal to an integer", () => {
    expect(normalizeCellInteger("12.9")).toBe(12);
  });
});

describe("normalizeCellDate", () => {
  it("passes through an ISO date unchanged", () => {
    expect(normalizeCellDate("2026-09-14")).toBe("2026-09-14");
  });

  it("converts DD/MM/YYYY to ISO", () => {
    expect(normalizeCellDate("14/09/2026")).toBe("2026-09-14");
    expect(normalizeCellDate("5/1/2026")).toBe("2026-01-05");
  });

  it("returns null for an unparseable date", () => {
    expect(normalizeCellDate("no vencido")).toBeNull();
  });
});
