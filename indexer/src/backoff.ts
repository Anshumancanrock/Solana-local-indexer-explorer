export const INITIAL_RECONNECT_DELAY_MS = 1_000;
export const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * Exponential backoff with half jitter.
 *
 * The delay doubles with each consecutive failure up to `maxMs`, and the
 * returned value lands somewhere in the upper half of that window. The jitter
 * keeps several indexers from reconnecting to the same endpoint in lockstep,
 * while the floor of half the window stops the loop from spinning when the
 * endpoint is refusing connections instantly.
 */
export function nextBackoffDelay(
  attempt: number,
  random: () => number = Math.random,
  initialMs: number = INITIAL_RECONNECT_DELAY_MS,
  maxMs: number = MAX_RECONNECT_DELAY_MS
): number {
  const exponent = Math.max(0, attempt - 1);
  const window = Math.min(initialMs * 2 ** exponent, maxMs);
  const half = window / 2;
  return Math.round(half + random() * half);
}
