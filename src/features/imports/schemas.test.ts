import { describe, expect, it } from "vitest";

import { channelExtractRowSchema, debtReportRowSchema } from "./schemas";

describe("channelExtractRowSchema", () => {
  it("parses a valid row, treating the dash placeholder as no points", () => {
    const result = channelExtractRowSchema.safeParse({
      external_code: "3345548",
      full_name: "ADELA SOLEDAD FARRO TEJADA",
      status: "Inactiva 3",
      level: "Bronce",
      accumulated_points: "-",
      phone: "917008577",
      district: "SAN PEDRO DE LLOC",
    });

    expect(result.success).toBe(true);
    expect(result.data?.accumulated_points).toBeNull();
    expect(result.data?.external_code).toBe("3345548");
  });

  it("rejects a row with no external_code", () => {
    const result = channelExtractRowSchema.safeParse({
      external_code: null,
      full_name: "Sin código",
      status: "Activa",
      level: "Bronce",
      accumulated_points: "10",
      phone: null,
      district: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("debtReportRowSchema", () => {
  it("parses a valid row and normalizes the due date", () => {
    const result = debtReportRowSchema.safeParse({
      external_code: "46982",
      full_name: "ELIANA CATHERINE CABRERA VALENCIA",
      phone: "948680956",
      commercial_status: "Inactiva 1",
      level: "Bronce",
      title_value: "175.74",
      principal_balance: "0",
      current_balance: "0",
      situation: "Pagado",
      maturity_status: "No vencido",
      acquisition_cycle: "202607",
      due_date: "2026-06-08",
      days_overdue: "0",
    });

    expect(result.success).toBe(true);
    expect(result.data?.due_date).toBe("2026-06-08");
    expect(result.data?.title_value).toBe(175.74);
    expect(result.data?.days_overdue).toBe(0);
  });

  it("rejects a row with no external_code (CODIGO)", () => {
    const result = debtReportRowSchema.safeParse({
      external_code: "",
      full_name: "Sin código",
      phone: null,
      commercial_status: null,
      level: null,
      title_value: null,
      principal_balance: null,
      current_balance: null,
      situation: null,
      maturity_status: null,
      acquisition_cycle: null,
      due_date: null,
      days_overdue: null,
    });

    expect(result.success).toBe(false);
  });
});
