import { describe, expect, it } from "vitest";

import { contactFormSchema, contactUpdateFormSchema } from "./schemas";

const organizationId = "00000000-0000-4000-8000-000000000001";

describe("contactFormSchema", () => {
  it("normalizes contact fields without losing leading zeroes", () => {
    const result = contactFormSchema.safeParse({
      organizationId,
      externalCode: " 00123 ",
      fullName: "  Juana Perez  ",
      phone: "",
      currentStatus: " Activa ",
      currentLevel: " Bronce ",
      district: "  Miraflores ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      externalCode: "00123",
      fullName: "Juana Perez",
      phone: null,
      currentStatus: "Activa",
      currentLevel: "Bronce",
      district: "Miraflores",
    });
  });

  it("requires a usable external code", () => {
    const result = contactFormSchema.safeParse({
      organizationId,
      externalCode: " ",
      fullName: "Juana Perez",
      phone: null,
      currentStatus: null,
      currentLevel: null,
      district: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("contactUpdateFormSchema", () => {
  it("does not accept external code changes during normal profile edits", () => {
    const result = contactUpdateFormSchema.safeParse({
      organizationId,
      contactId: "00000000-0000-4000-8000-000000000002",
      externalCode: "99999",
      fullName: "Juana Perez",
      phone: "",
      currentStatus: "",
      currentLevel: "",
      district: "",
    });

    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("externalCode");
  });
});
