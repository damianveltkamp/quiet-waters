import { describe, it, expect } from "vitest";
import { isValidEmail } from "@/lib/email";

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("someone@example.com")).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidEmail("  someone@example.com  ")).toBe(true);
  });

  it("rejects a missing @", () => {
    expect(isValidEmail("someone.example.com")).toBe(false);
  });

  it("rejects a missing domain", () => {
    expect(isValidEmail("someone@")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
