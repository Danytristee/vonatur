import { describe, expect, it } from "vitest";

import { deleteNoteSchema, noteFormSchema } from "./schemas";

const validUuid = "00000000-0000-4000-8000-000000000001";

describe("noteFormSchema", () => {
  it("accepts a non-empty note for a valid contact", () => {
    const result = noteFormSchema.safeParse({
      organizationId: validUuid,
      contactId: validUuid,
      body: "Prometió pagar el viernes.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a blank note", () => {
    expect(
      noteFormSchema.safeParse({
        organizationId: validUuid,
        contactId: validUuid,
        body: "   ",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid contact id", () => {
    expect(
      noteFormSchema.safeParse({
        organizationId: validUuid,
        contactId: "not-a-uuid",
        body: "Nota válida",
      }).success,
    ).toBe(false);
  });
});

describe("deleteNoteSchema", () => {
  it("accepts valid ids", () => {
    expect(
      deleteNoteSchema.safeParse({
        organizationId: validUuid,
        noteId: validUuid,
      }).success,
    ).toBe(true);
  });
});
