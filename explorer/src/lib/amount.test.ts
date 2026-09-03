import { describe, it, expect } from "vitest";
import { LAMPORTS_PER_SOL, parseAmount } from "./amount";

describe("parseAmount", () => {
  it("exposes lamports per SOL as a bigint", () => {
    expect(LAMPORTS_PER_SOL).toBe(1000000000n);
  });

  it("returns null for null, empty and whitespace-only input", () => {
    expect(parseAmount(null, "sol")).toBeNull();
    expect(parseAmount("", "sol")).toBeNull();
    expect(parseAmount("   ", "lamports")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseAmount("abc", "sol")).toBeNull();
    expect(parseAmount("1.2.3", "sol")).toBeNull();
    expect(parseAmount("0x10", "lamports")).toBeNull();
    expect(parseAmount(".", "sol")).toBeNull();
    expect(parseAmount("-", "sol")).toBeNull();
    expect(parseAmount("5.", "sol")).toBeNull();
  });

  it("returns null for exponent notation and Infinity", () => {
    expect(parseAmount("1e9", "sol")).toBeNull();
    expect(parseAmount("1E9", "lamports")).toBeNull();
    expect(parseAmount("Infinity", "sol")).toBeNull();
    expect(parseAmount("NaN", "lamports")).toBeNull();
  });

  it("converts whole SOL", () => {
    expect(parseAmount("1", "sol")).toBe(1000000000n);
    expect(parseAmount("0", "sol")).toBe(0n);
    expect(parseAmount("+2", "sol")).toBe(2000000000n);
  });

  it("converts fractional SOL exactly", () => {
    expect(parseAmount("1.000000001", "sol")).toBe(1000000001n);
    expect(parseAmount("0.000000001", "sol")).toBe(1n);
    expect(parseAmount(".5", "sol")).toBe(500000000n);
  });

  it("truncates SOL fractions longer than 9 digits", () => {
    expect(parseAmount("1.0000000009", "sol")).toBe(1000000000n);
    expect(parseAmount("1.9999999999", "sol")).toBe(1999999999n);
  });

  it("handles negative values (balanceChange can be negative)", () => {
    expect(parseAmount("-0.5", "sol")).toBe(-500000000n);
    expect(parseAmount("-1", "lamports")).toBe(-1n);
    expect(parseAmount("-12345678901234567890", "lamports")).toBe(-12345678901234567890n);
  });

  it("rejects a fraction when the unit is lamports", () => {
    expect(parseAmount("1.5", "lamports")).toBeNull();
    expect(parseAmount("1.0", "lamports")).toBeNull();
  });

  it("is exact far above 2^53", () => {
    // 2^53 + 1 lamports - Number() would round this to 9007199254740992.
    expect(parseAmount("9007199254740993", "lamports")).toBe(9007199254740993n);
    expect(parseAmount("18446744073709551615", "lamports")).toBe(18446744073709551615n);
    // The same magnitude expressed in SOL.
    expect(parseAmount("9007199.254740993", "sol")).toBe(9007199254740993n);
    expect(parseAmount("123456789.123456789", "sol")).toBe(123456789123456789n);
  });

  it("never goes through a float", () => {
    const lamports = parseAmount("9007199254740993", "lamports");
    expect(lamports).not.toBe(9007199254740992n);
    expect(String(lamports)).toBe("9007199254740993");
  });
});
