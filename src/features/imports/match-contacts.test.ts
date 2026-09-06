import { describe, expect, it } from "vitest";

import { matchDebtsToContacts } from "./match-contacts";
import type { ChannelExtractRow, DebtReportRow } from "./schemas";

function channelRow(overrides: Partial<ChannelExtractRow>): ChannelExtractRow {
  return {
    external_code: "123",
    full_name: "Ana Pérez",
    status: "Activa",
    level: "Bronce",
    accumulated_points: 100,
    phone: "999999999",
    district: "Trujillo",
    ...overrides,
  };
}

function debtRow(overrides: Partial<DebtReportRow>): DebtReportRow {
  return {
    external_code: "123",
    full_name: "Ana Pérez",
    phone: "999999999",
    commercial_status: "Activa",
    level: "Bronce",
    title_value: 100,
    principal_balance: 100,
    current_balance: 100,
    situation: "Pendiente",
    maturity_status: "No vencido",
    acquisition_cycle: "202607",
    due_date: "2026-09-14",
    days_overdue: 0,
    ...overrides,
  };
}

describe("matchDebtsToContacts", () => {
  it("matches a debt row by external_code alone, ignoring name spelling", () => {
    const channel = [channelRow({ full_name: "ANA PÉREZ GÓMEZ" })];
    const debt = [debtRow({ full_name: "Ana Perez G." })];

    const [result] = matchDebtsToContacts(channel, debt, new Set());

    expect(result).toEqual({ status: "matched", debtRow: debt[0] });
  });

  it("flags a debt row with no channel extract match and no existing contact", () => {
    const debt = [debtRow({ external_code: "999" })];

    const [result] = matchDebtsToContacts([], debt, new Set());

    expect(result).toEqual({
      status: "needs_review",
      reason: "no_channel_extract_match",
      debtRow: debt[0],
    });
  });

  it("matches against an existing contact from a previous cycle even without a channel extract row", () => {
    const debt = [debtRow({ external_code: "999" })];

    const [result] = matchDebtsToContacts([], debt, new Set(["999"]));

    expect(result.status).toBe("matched");
  });

  it("flags a phone mismatch for review instead of silently accepting or rejecting it", () => {
    const channel = [channelRow({ phone: "111111111" })];
    const debt = [debtRow({ phone: "222222222" })];

    const [result] = matchDebtsToContacts(channel, debt, new Set());

    expect(result).toEqual({
      status: "needs_review",
      reason: "phone_mismatch",
      debtRow: debt[0],
    });
  });

  it("does not flag a mismatch when either side is missing a phone", () => {
    const channel = [channelRow({ phone: null })];
    const debt = [debtRow({ phone: "222222222" })];

    const [result] = matchDebtsToContacts(channel, debt, new Set());

    expect(result.status).toBe("matched");
  });
});
