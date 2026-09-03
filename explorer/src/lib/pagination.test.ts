import { describe, it, expect } from "vitest";
import { parseIntParam, parsePagination, totalPages } from "./pagination";

const OPTS = { fallback: 20, min: 1, max: 100 };

describe("parseIntParam", () => {
  it("returns the fallback for null", () => {
    expect(parseIntParam(null, OPTS)).toBe(20);
  });

  it("returns the fallback for an empty or whitespace-only string", () => {
    expect(parseIntParam("", OPTS)).toBe(20);
    expect(parseIntParam("   ", OPTS)).toBe(20);
  });

  it("returns the fallback for non-numeric input", () => {
    expect(parseIntParam("abc", OPTS)).toBe(20);
    expect(parseIntParam("12abc", OPTS)).toBe(20);
    expect(parseIntParam("-", OPTS)).toBe(20);
    expect(parseIntParam("1,000", OPTS)).toBe(20);
  });

  it("returns the fallback for NaN and Infinity", () => {
    expect(parseIntParam("NaN", OPTS)).toBe(20);
    expect(parseIntParam("Infinity", OPTS)).toBe(20);
    expect(parseIntParam("-Infinity", OPTS)).toBe(20);
  });

  it("returns the fallback for non-integer input", () => {
    expect(parseIntParam("1.5", OPTS)).toBe(20);
    expect(parseIntParam("2.0", OPTS)).toBe(20);
    expect(parseIntParam("1e3", OPTS)).toBe(20);
  });

  it("never returns NaN, whatever the input", () => {
    for (const raw of [null, "", " ", "abc", "NaN", "Infinity", "1.5", "-7", "1e3"]) {
      expect(Number.isNaN(parseIntParam(raw, OPTS))).toBe(false);
    }
  });

  it("parses a valid integer", () => {
    expect(parseIntParam("7", OPTS)).toBe(7);
    expect(parseIntParam(" 7 ", OPTS)).toBe(7);
    expect(parseIntParam("+7", OPTS)).toBe(7);
  });

  it("clamps below min and above max", () => {
    expect(parseIntParam("0", OPTS)).toBe(1);
    expect(parseIntParam("-5", OPTS)).toBe(1);
    expect(parseIntParam("100000", OPTS)).toBe(100);
    expect(parseIntParam("999999999999999999999", OPTS)).toBe(100);
  });

  it("clamps the fallback itself into range", () => {
    expect(parseIntParam(null, { fallback: 500, min: 1, max: 100 })).toBe(100);
    expect(parseIntParam("abc", { fallback: 0, min: 1, max: 100 })).toBe(1);
  });
});

describe("parsePagination", () => {
  it("defaults to page 1 / limit 20 / skip 0 when nothing is supplied", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("survives the NaN inputs that used to produce a 500", () => {
    const params = new URLSearchParams({ page: "abc", limit: "xyz" });
    expect(parsePagination(params)).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("clamps limit to 100 and page to at least 1", () => {
    const params = new URLSearchParams({ page: "0", limit: "5000" });
    expect(parsePagination(params)).toEqual({ page: 1, limit: 100, skip: 0 });
  });

  it("computes skip from the clamped values", () => {
    const params = new URLSearchParams({ page: "3", limit: "25" });
    expect(parsePagination(params)).toEqual({ page: 3, limit: 25, skip: 50 });
  });

  it("clamps page to the 1_000_000 maximum", () => {
    const params = new URLSearchParams({ page: "99999999", limit: "1" });
    expect(parsePagination(params).page).toBe(1_000_000);
  });
});

describe("totalPages", () => {
  it("is at least 1 when there is nothing to page through", () => {
    expect(totalPages(0, 20)).toBe(1);
  });

  it("rounds up", () => {
    expect(totalPages(21, 20)).toBe(2);
    expect(totalPages(40, 20)).toBe(2);
  });

  it("never returns NaN or Infinity", () => {
    expect(totalPages(10, 0)).toBe(1);
    expect(totalPages(Number.NaN, 20)).toBe(1);
    expect(totalPages(10, Number.NaN)).toBe(1);
    expect(totalPages(Number.POSITIVE_INFINITY, 20)).toBe(1);
  });
});
