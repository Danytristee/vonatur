import { describe, expect, it } from "vitest";

import { cycleFormSchema } from "./schemas";

describe("cycleFormSchema", () => {
  it("accepts a valid commercial cycle", () => {
    const result = cycleFormSchema.safeParse({
      organizationId: "00000000-0000-4000-8000-000000000001",
      year: "2026",
      cycleNumber: "7",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      year: 2026,
      cycleNumber: 7,
    });
  });

  it("rejects cycle numbers outside the commercial range", () => {
    expect(
      cycleFormSchema.safeParse({
        organizationId: "00000000-0000-4000-8000-000000000001",
        year: "2026",
        cycleNumber: "0",
      }).success,
    ).toBe(false);

    expect(
      cycleFormSchema.safeParse({
        organizationId: "00000000-0000-4000-8000-000000000001",
        year: "2026",
        cycleNumber: "20",
      }).success,
    ).toBe(false);
  });
});
