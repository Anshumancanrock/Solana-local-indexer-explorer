/**
 * Exact decimal-string -> lamports conversion.
 *
 * Amount search is an exact-match feature, so nothing here may touch a float:
 * Number()/Math.round() lose precision above 2^53 lamports (~9,007,199 SOL) and
 * would silently match the wrong row. The string is parsed digit-wise into BigInt.
 */

export const LAMPORTS_PER_SOL = 1_000_000_000n;

const SOL_DECIMALS = 9;

// Optional sign, optional integer digits, optional "." followed by at least one
// fraction digit. Rejects exponent notation, a bare "." and a trailing "5.".
const DECIMAL_PATTERN = /^([+-]?)(\d*)(?:\.(\d+))?$/;

/**
 * Converts a decimal string to lamports. Returns null for anything that is not a
 * plain decimal number (null, "", whitespace, "abc", "1e9", "Infinity", "5."),
 * and for a fractional value when `unit` is "lamports".
 *
 * SOL fractions longer than 9 digits are TRUNCATED (not rounded) - a lamport is
 * the smallest indivisible unit, so the extra digits do not name a real amount.
 */
export function parseAmount(value: string | null, unit: "sol" | "lamports"): bigint | null {
  if (value === null) return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = DECIMAL_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, sign, intPart, fracPart] = match;
  if (intPart === "" && fracPart === undefined) return null;

  if (unit === "lamports") {
    if (fracPart !== undefined) return null;
    return applySign(sign, BigInt(intPart));
  }

  const fraction = (fracPart ?? "").slice(0, SOL_DECIMALS).padEnd(SOL_DECIMALS, "0");
  return applySign(sign, BigInt((intPart === "" ? "0" : intPart) + fraction));
}

function applySign(sign: string, magnitude: bigint): bigint {
  return sign === "-" ? -magnitude : magnitude;
}
