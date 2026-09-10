import { describe, it, expect } from "vitest";
import {
  nextBackoffDelay,
  INITIAL_RECONNECT_DELAY_MS,
  MAX_RECONNECT_DELAY_MS,
} from "./backoff";

const lowest = () => 0;
const highest = () => 1;

describe("nextBackoffDelay", () => {
  it("doubles the window on each consecutive attempt", () => {
    expect(nextBackoffDelay(1, highest)).toBe(1_000);
    expect(nextBackoffDelay(2, highest)).toBe(2_000);
    expect(nextBackoffDelay(3, highest)).toBe(4_000);
    expect(nextBackoffDelay(4, highest)).toBe(8_000);
  });

  it("never returns less than half the current window", () => {
    expect(nextBackoffDelay(1, lowest)).toBe(500);
    expect(nextBackoffDelay(3, lowest)).toBe(2_000);
  });

  it("caps the delay at the maximum", () => {
    expect(nextBackoffDelay(20, highest)).toBe(MAX_RECONNECT_DELAY_MS);
    expect(nextBackoffDelay(20, lowest)).toBe(MAX_RECONNECT_DELAY_MS / 2);
  });

  it("treats the first attempt and a zero attempt the same", () => {
    expect(nextBackoffDelay(0, highest)).toBe(INITIAL_RECONNECT_DELAY_MS);
    expect(nextBackoffDelay(1, highest)).toBe(INITIAL_RECONNECT_DELAY_MS);
  });

  it("always produces a positive delay", () => {
    for (let attempt = 1; attempt <= 12; attempt++) {
      expect(nextBackoffDelay(attempt, Math.random)).toBeGreaterThan(0);
    }
  });
});
