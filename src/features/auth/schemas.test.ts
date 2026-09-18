import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, resetPasswordSchema } from "./schemas";

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "lider@example.com" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "no-es-un-correo" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of sufficient length", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "contraseña-nueva",
        confirmPassword: "contraseña-nueva",
      }).success,
    ).toBe(true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "corta1",
        confirmPassword: "corta1",
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "contraseña-nueva",
        confirmPassword: "otra-contraseña",
      }).success,
    ).toBe(false);
  });
});
