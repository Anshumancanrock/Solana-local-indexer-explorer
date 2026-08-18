/**
 * Recursively converts BigInt values to strings for JSON serialization.
 * PostgreSQL BIGINT -> Prisma BigInt -> JS BigInt, which JSON.stringify cannot handle.
 */
export function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString() as unknown as T;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  // Binary blobs (protobuf bytes that reached a Json column) are objects, so the
  // generic branch below would emit {"0":1,"1":2,...}. Serialize them as lowercase
  // hex instead. Covers Buffer too - it is a Uint8Array subclass.
  if (obj instanceof Uint8Array) return bytesToHex(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeBigInts) as unknown as T;
  if (typeof obj === "object") {
    // Object.entries works on null-prototype objects, so Prisma's Json values and
    // Object.create(null) records both walk correctly and come back plain.
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }
  return obj;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}
