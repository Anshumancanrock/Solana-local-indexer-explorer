/**
 * Query-parameter parsing for paginated API routes.
 *
 * `Math.max(1, parseInt("abc", 10))` is NaN, and a NaN `skip`/`take` makes Prisma
 * throw, which Next turns into a bodyless 500. Everything numeric that reaches a
 * query goes through `parseIntParam`, which can never return NaN.
 */

export interface IntParamOptions {
  fallback: number;
  min: number;
  max: number;
}

const INTEGER_PATTERN = /^[+-]?\d+$/;

/**
 * Parses a raw query-string value into an integer clamped to [min, max].
 * Returns the (clamped) fallback for null, "", whitespace, non-numeric input,
 * "NaN", "Infinity", exponent notation and non-integer values.
 */
export function parseIntParam(raw: string | null, opts: IntParamOptions): number {
  const clamp = (n: number): number => Math.min(opts.max, Math.max(opts.min, n));

  if (raw === null) return clamp(opts.fallback);

  const trimmed = raw.trim();
  if (trimmed === "" || !INTEGER_PATTERN.test(trimmed)) return clamp(opts.fallback);

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return clamp(opts.fallback);

  return clamp(parsed);
}

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(searchParams: URLSearchParams): Pagination {
  const page = parseIntParam(searchParams.get("page"), {
    fallback: 1,
    min: 1,
    max: 1_000_000,
  });
  const limit = parseIntParam(searchParams.get("limit"), {
    fallback: 20,
    min: 1,
    max: 100,
  });

  return { page, limit, skip: (page - 1) * limit };
}

/** Always a finite integer >= 1, whatever the inputs. */
export function totalPages(total: number, limit: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(limit) || limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}
