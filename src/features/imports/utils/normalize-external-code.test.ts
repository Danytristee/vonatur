import { describe, expect, it } from "vitest";

import { normalizeExternalCode } from "./normalize-external-code";

describe("normalizeExternalCode", () => {
  it("trims leading and trailing spreadsheet whitespace", () => {
    expect(normalizeExternalCode("\t 00123\r\n")).toBe("00123");
    expect(normalizeExternalCode("\u00A000123\u00A0")).toBe("00123");
  });

  it("preserves leading zeros", () => {
    expect(normalizeExternalCode("000123")).toBe("000123");
  });

  it("converts numeric-looking values to strings without changing their digits", () => {
    expect(normalizeExternalCode(123)).toBe("123");
  });

  it("rejects empty or whitespace-only values", () => {
    expect(() => normalizeExternalCode(null)).toThrow("external_code is required");
    expect(() => normalizeExternalCode(undefined)).toThrow("external_code is required");
    expect(() => normalizeExternalCode("\t\r\n\u00A0")).toThrow("external_code is required");
  });
});
