import { describe, expect, it } from "vitest";

import { normalizeHeader } from "./normalize-header";

describe("normalizeHeader", () => {
  it("strips accents", () => {
    expect(normalizeHeader("CÓDIGO DE CONSULTORA")).toBe("CODIGO DE CONSULTORA");
    expect(normalizeHeader("TELÉFONO")).toBe("TELEFONO");
    expect(normalizeHeader("VALOR TÍTULO")).toBe("VALOR TITULO");
  });

  it("case-folds to upper case", () => {
    expect(normalizeHeader("Código de Consultora")).toBe("CODIGO DE CONSULTORA");
  });

  it("collapses and trims whitespace", () => {
    expect(normalizeHeader("  NOMBRE   DE GRUPO  ")).toBe("NOMBRE DE GRUPO");
  });

  it("leaves an already-canonical header unchanged", () => {
    expect(normalizeHeader("CICLO DE CAPTACION")).toBe("CICLO DE CAPTACION");
  });
});
