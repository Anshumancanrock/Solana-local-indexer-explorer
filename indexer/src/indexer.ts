import {
  upsertTransaction,
  upsertFailedTransaction,
  upsertAccountsForTransaction,
} from "./db/query";
import Client, {
  CommitmentLevel,
  SubscribeRequest,
} from "@triton-one/yellowstone-grpc";
import bs58 from "bs58";
import { nextBackoffDelay } from "./backoff";

const YELLOWSTONE_ADDR = process.env.YELLOWSTONE_ADDR || "localhost:10000";
const YELLOWSTONE_XTOKEN = process.env.YELLOWSTONE_XTOKEN || null;

// A stream that survives this long is treated as a successful connection, so
// the next failure starts backing off from the beginning again.
const HEALTHY_CONNECTION_MS = 60_000;

const CHANNEL_OPTIONS = {
  "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MB
  // Detect a connection that is open at the socket level but no longer
  // delivering data, which is what happens when the validator disappears
  // without closing the stream.
  "grpc.keepalive_time_ms": 30_000,
  "grpc.keepalive_timeout_ms": 10_000,
  "grpc.keepalive_permit_without_calls": 0,
};

const SUBSCRIBE_REQUEST: SubscribeRequest = {
  accounts: {},
  slots: {
    client: {
      filterByCommitment: false,
    },
  },
  transactions: {
    client: {
      accountInclude: [],
      accountExclude: [],
      accountRequired: [],
    },
  },
  transactionsStatus: {},
  entry: {},
  blocks: {},
  blocksMeta: {},
  commitment: CommitmentLevel.PROCESSED,
  accountsDataSlice: [],
  ping: undefined,
};

type StreamExit = { reason: "error" | "end" | "close"; error?: unknown };

let shuttingDown = false;
let activeStream: any = null;
let wakeFromBackoff: (() => void) | null = null;

function endpointUrl(): string {
  // The Client expects a full URL (it parses it to extract hostname and port)
  // Convert host:port to http://host:port format
  if (
    YELLOWSTONE_ADDR.startsWith("http://") ||
    YELLOWSTONE_ADDR.startsWith("https://")
  ) {
    return YELLOWSTONE_ADDR;
  }
  return `http://${YELLOWSTONE_ADDR}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      wakeFromBackoff = null;
      resolve();
    }, ms);
    // Let a shutdown signal cut the wait short instead of blocking for the
    // full backoff window.
    wakeFromBackoff = () => {
      clearTimeout(timer);
      wakeFromBackoff = null;
      resolve();
    };
  });
}

function closeClient(client: Client) {
  try {
    (client as any)._client?.close();
  } catch {
    // The channel is already gone; nothing to release.
  }
}

function destroyStream(stream: any) {
  try {
    stream.removeAllListeners();
    stream.destroy();
  } catch {
    // Already torn down.
  }
}

export async function handleUpdate(data: any): Promise<void> {
  // Handle slot updates - we can log them but don't need to store blocks
  if (data.slot) {
    const s = data.slot.slot;
    const status = data.slot.status;
    // Status: 0 = first seen, 1 = confirmed, 2 = finalized
    console.log(`Slot ${s} status: ${status}`);
  }

  // Handle transaction updates
  if (!data.transaction) return;

  const txUpdate = data.transaction;
  const slot = txUpdate.slot;
  const transaction = txUpdate.transaction;

  if (!transaction) return;

  // Extract signature from transaction and convert to base58 string
  let signature: string;
  if (transaction.signature) {
    // Signature is a Buffer (64 bytes)
    if (
      transaction.signature instanceof Uint8Array ||
      (typeof Buffer !== "undefined" && Buffer.isBuffer(transaction.signature))
    ) {
      signature = bs58.encode(transaction.signature);
    } else if (typeof transaction.signature === "string") {
      signature = transaction.signature;
    } else {
      signature = "unknown";
    }
  } else {
    signature = "unknown";
  }

  // Extract all accounts (not just signers) and convert to base58 strings
  const accounts: string[] = [];
  if (transaction.transaction?.message?.accountKeys) {
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

  // Extract instructions as JSON array
  const instructions: any[] = [];
  if (transaction.transaction?.message?.instructions) {
    transaction.transaction.message.instructions.forEach(
      (inst: any, index: number) => {
        // Convert instruction to JSON-serializable format
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
        // Add raw instruction data if available
        if (inst) {
          instructionData.raw = inst;
        }
        instructions.push(instructionData);
      }
    );
  }

  // Extract compute units used
  const computeUnitsUsed = transaction.meta?.computeUnitsConsumed
    ? BigInt(transaction.meta.computeUnitsConsumed)
    : undefined;

  // Extract fee
  const fee = transaction.meta?.fee ? BigInt(transaction.meta.fee) : undefined;

  // Determine success
  const success =
    transaction.meta?.err === null || transaction.meta?.err === undefined;

  // Extract blockTime (use current time if not available)
  const blockTime = new Date();

  // Extract log messages
  const logs = transaction.meta?.logMessages || [];

  // Extract error information
  const error = transaction.meta?.err
    ? JSON.stringify(transaction.meta.err)
    : null;

  // Extract balance information
  const preBalances = transaction.meta?.preBalances || [];
  const postBalances = transaction.meta?.postBalances || [];

  try {
    if (success) {
      const tx = await upsertTransaction({
        signature,
        slot: BigInt(slot),
        blockTime,
        success,
        fee,
        computeUnitsUsed,
        accounts,
        instructions,
        preBalances,
        postBalances,
      });

      await upsertAccountsForTransaction(tx.id, accounts);

      console.log(
        `Indexed transaction ${signature.substring(0, 8)}... (slot ${slot})`
      );
    } else {
      await upsertFailedTransaction({
        signature,
        slot: BigInt(slot),
        error: error || "Unknown error",
        logs,
        accounts,
        blockTime,
      });

      console.log(
        `Indexed failed transaction ${signature.substring(
          0,
          8
        )}... (slot ${slot})`
      );
    }
  } catch (error: any) {
    // Ignore unique constraint errors (transaction already exists)
    if (error.code !== "P2002") {
      console.error(`Error indexing transaction ${signature}:`, error);
    }
  }
}

/**
 * Opens one subscription and resolves when that stream terminates, whichever
 * way it terminates. Throws only if the subscription could never be
 * established, which the caller treats the same as a dropped stream.
 */
async function runStream(): Promise<StreamExit> {
  const endpoint = endpointUrl();
  console.log("Connecting to Yellowstone gRPC:", endpoint);

  const client = new Client(
    endpoint,
    YELLOWSTONE_XTOKEN || undefined,
    CHANNEL_OPTIONS
  );

  let stream: any;
  try {
    stream = await client.subscribe();
  } catch (error) {
    closeClient(client);
    throw error;
  }

  activeStream = stream;

  // Register the lifecycle handlers before the first write, so an immediate
  // failure is captured rather than thrown as an unhandled "error" event.
  const exit = new Promise<StreamExit>((resolve) => {
    let settled = false;
    const settle = (reason: StreamExit["reason"], error?: unknown) => {
      if (settled) return;
      settled = true;
      resolve({ reason, error });
    };

    stream.on("error", (err: unknown) => settle("error", err));
    stream.on("end", () => settle("end"));
    stream.on("close", () => settle("close"));
  });

  stream.on("data", (data: any) => {
    handleUpdate(data).catch((error) => {
      console.error("Error handling stream update:", error);
    });
  });

  try {
    await new Promise<void>((resolve, reject) => {
      stream.write(SUBSCRIBE_REQUEST, (err: unknown) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    });
  } catch (error) {
    activeStream = null;
    destroyStream(stream);
    closeClient(client);
    throw error;
  }

  console.log("Subscribed to slots and transactions");

  const result = await exit;

  activeStream = null;
  destroyStream(stream);
  closeClient(client);

  return result;
}

/**
 * Keeps a subscription alive for the lifetime of the process. Every way a
 * stream can end (error, server-side end, channel close, failed connect) falls
 * through to the same backoff and re-subscribe path, so the indexer recovers
 * from a validator restart on its own instead of sitting on a dead stream.
 */
export const startIndexer = async (): Promise<void> => {
  let attempt = 0;

  while (!shuttingDown) {
    const connectedAt = Date.now();

    try {
      const exit = await runStream();

      if (shuttingDown) return;

      if (exit.error) {
        console.error(`gRPC stream failed (${exit.reason}):`, exit.error);
      } else {
        console.error(`gRPC stream ${exit.reason} without an error`);
      }
    } catch (error) {
      if (shuttingDown) return;
      console.error("Failed to subscribe to Yellowstone gRPC:", error);
    }

    if (Date.now() - connectedAt >= HEALTHY_CONNECTION_MS) {
      attempt = 0;
    }
    attempt += 1;

    const delay = nextBackoffDelay(attempt);
    console.error(
      `Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${attempt})`
    );
    await sleep(delay);
  }
};

export function stopIndexer(): void {
  shuttingDown = true;
  if (activeStream) {
    destroyStream(activeStream);
    activeStream = null;
  }
  if (wakeFromBackoff) {
    wakeFromBackoff();
  }
}
