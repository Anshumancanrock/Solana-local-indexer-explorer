/**
 * TEST-ONLY MIRROR of the transaction-parsing logic in `handleUpdate()`
 * in `src/indexer.ts`.
 *
 * `handleUpdate` is exported, but importing it pulls in `db/query` and the
 * Prisma client, so these tests mirror the parsing steps instead of calling
 * it directly. That keeps the suite runnable without a database.
 *
 * IMPORTANT: if the parsing logic in `indexer.ts` changes, this mirror
 * must be updated to match, or these tests will validate stale behavior.
 */
import bs58 from "bs58";

export function parseSignature(signature: any): string {
  if (signature) {
    if (
      signature instanceof Uint8Array ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer(signature))
    ) {
      return bs58.encode(signature);
    } else if (typeof signature === "string") {
      return signature;
    } else {
      return "unknown";
    }
  }
  return "unknown";
}

export function parseAccounts(transaction: any): string[] {
  const accounts: string[] = [];
  if (transaction?.transaction?.message?.accountKeys) {
    transaction.transaction.message.accountKeys.forEach((key: any) => {
      if (
        key instanceof Uint8Array ||
        (typeof Buffer !== "undefined" && Buffer.isBuffer(key))
      ) {
        accounts.push(bs58.encode(key));
      } else if (typeof key === "string") {
        accounts.push(key);
      }
    });
  }
  return accounts;
}

export function parseInstructions(transaction: any): any[] {
  const instructions: any[] = [];
  if (transaction?.transaction?.message?.instructions) {
    transaction.transaction.message.instructions.forEach(
      (inst: any, index: number) => {
        const instructionData: any = {
          programIdIndex: inst.programIdIndex,
          accounts: inst.accounts || [],
          data: inst.data
            ? inst.data instanceof Uint8Array ||
              (typeof Buffer !== "undefined" && Buffer.isBuffer(inst.data))
              ? bs58.encode(inst.data)
              : inst.data
            : null,
          instructionIndex: index,
        };
        if (inst) {
          instructionData.raw = inst;
        }
        instructions.push(instructionData);
      }
    );
  }
  return instructions;
}

export function parseComputeUnitsUsed(transaction: any): bigint | undefined {
  return transaction?.meta?.computeUnitsConsumed
    ? BigInt(transaction.meta.computeUnitsConsumed)
    : undefined;
}

export function parseFee(transaction: any): bigint | undefined {
  return transaction?.meta?.fee ? BigInt(transaction.meta.fee) : undefined;
}

export function parseSuccess(transaction: any): boolean {
  return (
    transaction?.meta?.err === null || transaction?.meta?.err === undefined
  );
}

export function parseError(transaction: any): string | null {
  return transaction?.meta?.err
    ? JSON.stringify(transaction.meta.err)
    : null;
}

export function parseBalances(transaction: any): {
  preBalances: (number | bigint)[];
  postBalances: (number | bigint)[];
} {
  return {
    preBalances: transaction?.meta?.preBalances || [],
    postBalances: transaction?.meta?.postBalances || [],
  };
}

export function parseLogs(transaction: any): string[] {
  return transaction?.meta?.logMessages || [];
}
