import { describe, it, expect } from "vitest";
import bs58 from "bs58";
import {
  parseSignature,
  parseAccounts,
  parseInstructions,
  parseComputeUnitsUsed,
  parseFee,
  parseSuccess,
  parseError,
  parseBalances,
  parseLogs,
} from "./parse-transaction.test-helper";

// Sample 64-byte signature and 32-byte pubkey buffers for realistic testing.
const sampleSigBuffer = Buffer.alloc(64, 7);
const samplePubkeyBuffer = Buffer.alloc(32, 3);

describe("parseSignature", () => {
  it("decodes a Buffer signature to base58", () => {
    const result = parseSignature(sampleSigBuffer);
    expect(result).toBe(bs58.encode(sampleSigBuffer));
  });

  it("decodes a Uint8Array signature to base58", () => {
    const arr = new Uint8Array(sampleSigBuffer);
    expect(parseSignature(arr)).toBe(bs58.encode(sampleSigBuffer));
  });

  it("passes through a string signature unchanged", () => {
    expect(parseSignature("alreadyBase58Sig")).toBe("alreadyBase58Sig");
  });

  it("falls back to 'unknown' for missing signature", () => {
    expect(parseSignature(null)).toBe("unknown");
    expect(parseSignature(undefined)).toBe("unknown");
  });

  it("falls back to 'unknown' for an unexpected type (e.g. number)", () => {
    expect(parseSignature(12345)).toBe("unknown");
  });
});

describe("parseAccounts", () => {
  it("decodes Buffer account keys to base58 strings", () => {
    const transaction = {
      transaction: { message: { accountKeys: [samplePubkeyBuffer] } },
    };
    expect(parseAccounts(transaction)).toEqual([bs58.encode(samplePubkeyBuffer)]);
  });

  it("passes through string account keys unchanged", () => {
    const transaction = {
      transaction: { message: { accountKeys: ["Addr1", "Addr2"] } },
    };
    expect(parseAccounts(transaction)).toEqual(["Addr1", "Addr2"]);
  });

  it("returns an empty array when accountKeys is missing", () => {
    expect(parseAccounts({})).toEqual([]);
    expect(parseAccounts({ transaction: {} })).toEqual([]);
  });

  it("preserves account key order (index is used as accountIndex elsewhere)", () => {
    const transaction = {
      transaction: { message: { accountKeys: ["First", "Second", "Third"] } },
    };
    expect(parseAccounts(transaction)).toEqual(["First", "Second", "Third"]);
  });
});

describe("parseInstructions", () => {
  it("extracts programIdIndex, accounts, decoded data, and index", () => {
    const dataBuffer = Buffer.from([1, 2, 3]);
    const transaction = {
      transaction: {
        message: {
          instructions: [
            { programIdIndex: 2, accounts: [0, 1], data: dataBuffer },
          ],
        },
      },
    };
    const result = parseInstructions(transaction);
    expect(result).toHaveLength(1);
    expect(result[0].programIdIndex).toBe(2);
    expect(result[0].accounts).toEqual([0, 1]);
    expect(result[0].data).toBe(bs58.encode(dataBuffer));
    expect(result[0].instructionIndex).toBe(0);
    expect(result[0].raw).toBeDefined();
  });

  it("defaults 'accounts' to an empty array when missing", () => {
    const transaction = {
      transaction: { message: { instructions: [{ programIdIndex: 0 }] } },
    };
    expect(parseInstructions(transaction)[0].accounts).toEqual([]);
  });

  it("sets data to null when instruction has no data", () => {
    const transaction = {
      transaction: { message: { instructions: [{ programIdIndex: 0 }] } },
    };
    expect(parseInstructions(transaction)[0].data).toBeNull();
  });

  it("assigns instructionIndex matching array position for multiple instructions", () => {
    const transaction = {
      transaction: {
        message: {
          instructions: [
            { programIdIndex: 0 },
            { programIdIndex: 1 },
            { programIdIndex: 2 },
          ],
        },
      },
    };
    const result = parseInstructions(transaction);
    expect(result.map((i) => i.instructionIndex)).toEqual([0, 1, 2]);
  });

  it("returns an empty array when instructions are missing", () => {
    expect(parseInstructions({})).toEqual([]);
  });
});

describe("parseComputeUnitsUsed", () => {
  it("converts computeUnitsConsumed to BigInt when present", () => {
    const transaction = { meta: { computeUnitsConsumed: 2100 } };
    expect(parseComputeUnitsUsed(transaction)).toBe(2100n);
  });

  it("returns undefined when computeUnitsConsumed is missing", () => {
    expect(parseComputeUnitsUsed({ meta: {} })).toBeUndefined();
    expect(parseComputeUnitsUsed({})).toBeUndefined();
  });

  it("returns undefined when computeUnitsConsumed is 0 (falsy but valid)", () => {
    // NOTE: this documents existing behavior in indexer.ts — `0` is falsy in
    // JS, so `transaction.meta?.computeUnitsConsumed ? ... : undefined`
    // treats a real "0 compute units" transaction the same as "missing".
    // This is a pre-existing quirk in the production code, not introduced
    // by this test suite; flagged here rather than silently assumed away.
    expect(parseComputeUnitsUsed({ meta: { computeUnitsConsumed: 0 } })).toBeUndefined();
  });
});

describe("parseFee", () => {
  it("converts fee to BigInt when present", () => {
    expect(parseFee({ meta: { fee: 5000 } })).toBe(5000n);
  });

  it("returns undefined when fee is missing", () => {
    expect(parseFee({ meta: {} })).toBeUndefined();
    expect(parseFee({})).toBeUndefined();
  });
});

describe("parseSuccess", () => {
  it("returns true when meta.err is null", () => {
    expect(parseSuccess({ meta: { err: null } })).toBe(true);
  });

  it("returns true when meta.err is undefined (missing)", () => {
    expect(parseSuccess({ meta: {} })).toBe(true);
    expect(parseSuccess({})).toBe(true);
  });

  it("returns false when meta.err is a populated error object", () => {
    expect(parseSuccess({ meta: { err: { InstructionError: [0, "Custom"] } } })).toBe(false);
  });
});

describe("parseError", () => {
  it("returns null when there is no error", () => {
    expect(parseError({ meta: { err: null } })).toBeNull();
    expect(parseError({})).toBeNull();
  });

  it("serializes an error object to a JSON string", () => {
    const err = { InstructionError: [0, "Custom"] };
    expect(parseError({ meta: { err } })).toBe(JSON.stringify(err));
  });
});

describe("parseBalances", () => {
  it("extracts preBalances and postBalances arrays", () => {
    const transaction = { meta: { preBalances: [100, 200], postBalances: [90, 210] } };
    expect(parseBalances(transaction)).toEqual({
      preBalances: [100, 200],
      postBalances: [90, 210],
    });
  });

  it("defaults to empty arrays when balances are missing", () => {
    expect(parseBalances({})).toEqual({ preBalances: [], postBalances: [] });
    expect(parseBalances({ meta: {} })).toEqual({ preBalances: [], postBalances: [] });
  });
});

describe("parseLogs", () => {
  it("extracts logMessages when present", () => {
    const transaction = { meta: { logMessages: ["Program 111 invoke [1]", "Program 111 success"] } };
    expect(parseLogs(transaction)).toEqual([
      "Program 111 invoke [1]",
      "Program 111 success",
    ]);
  });

  it("defaults to an empty array when logMessages are missing", () => {
    expect(parseLogs({})).toEqual([]);
  });
});

describe("End-to-end sample transaction (successful vote tx shape)", () => {
  const sampleUpdate = {
    transaction: {
      signature: sampleSigBuffer,
      transaction: {
        message: {
          accountKeys: [samplePubkeyBuffer, samplePubkeyBuffer],
          instructions: [
            { programIdIndex: 1, accounts: [0], data: Buffer.from([10, 20]) },
          ],
        },
      },
      meta: {
        err: null,
        fee: 5000,
        computeUnitsConsumed: 2100,
        preBalances: [500000000000, 1000000],
        postBalances: [499999995000, 1005000],
        logMessages: ["Program Vote111 invoke [1]", "Program Vote111 success"],
      },
    },
  };

  it("parses every field consistently for a realistic full payload", () => {
    const tx = sampleUpdate.transaction;
    expect(parseSignature(tx.signature)).toBe(bs58.encode(sampleSigBuffer));
    expect(parseAccounts(tx)).toHaveLength(2);
    expect(parseInstructions(tx)).toHaveLength(1);
    expect(parseSuccess(tx)).toBe(true);
    expect(parseError(tx)).toBeNull();
    expect(parseFee(tx)).toBe(5000n);
    expect(parseComputeUnitsUsed(tx)).toBe(2100n);
    expect(parseBalances(tx).preBalances).toEqual([500000000000, 1000000]);
    expect(parseBalances(tx).postBalances).toEqual([499999995000, 1005000]);
    expect(parseLogs(tx)).toHaveLength(2);
  });
});
