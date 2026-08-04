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

const YELLOWSTONE_ADDR = process.env.YELLOWSTONE_ADDR || "localhost:10000";
const YELLOWSTONE_XTOKEN = process.env.YELLOWSTONE_XTOKEN || null;

export const startIndexer = async () => {
  // The Client expects a full URL (it parses it to extract hostname and port)
  // Convert host:port to http://host:port format
  let endpoint = YELLOWSTONE_ADDR;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `http://${endpoint}`;
  }
  
  console.log("Connecting to Yellowstone gRPC:", endpoint);

  const client = new Client(
    endpoint,
    YELLOWSTONE_XTOKEN || undefined,
    {
      "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MB
    }
  );

  try {
    const stream = await client.subscribe();

    // Create subscribe request for slots and all transactions
    const request: SubscribeRequest = {
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

    // Send subscribe request
    await new Promise<void>((resolve, reject) => {
      stream.write(request, (err) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    });

    console.log("Subscribed to slots and transactions");

    stream.on("data", async (data: any) => {
      // Handle slot updates - we can log them but don't need to store blocks
      if (data.slot) {
        const s = data.slot.slot;
        const status = data.slot.status;
        // Status: 0 = first seen, 1 = confirmed, 2 = finalized
        console.log(`Slot ${s} status: ${status}`);
      }

      // Handle transaction updates
      if (data.transaction) {
        const txUpdate = data.transaction;
        const slot = txUpdate.slot;
        const transaction = txUpdate.transaction;
        
        if (!transaction) return;

        // Extract signature from transaction and convert to base58 string
        let signature: string;
        if (transaction.signature) {
          // Signature is a Buffer (64 bytes)
          if (transaction.signature instanceof Uint8Array || 
              (typeof Buffer !== "undefined" && Buffer.isBuffer(transaction.signature))) {
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
            if (key instanceof Uint8Array || 
                (typeof Buffer !== "undefined" && Buffer.isBuffer(key))) {
              accounts.push(bs58.encode(key));
            } else if (typeof key === "string") {
              accounts.push(key);
            }
          });
        }

        // Extract instructions as JSON array
        const instructions: any[] = [];
        if (transaction.transaction?.message?.instructions) {
          transaction.transaction.message.instructions.forEach((inst: any, index: number) => {
            // Convert instruction to JSON-serializable format
            const instructionData: any = {
              programIdIndex: inst.programIdIndex,
              accounts: inst.accounts || [],
              data: inst.data ? (inst.data instanceof Uint8Array || (typeof Buffer !== "undefined" && Buffer.isBuffer(inst.data)) 
                ? bs58.encode(inst.data) 
                : inst.data) : null,
              instructionIndex: index,
            };
            // Add raw instruction data if available
            if (inst) {
              instructionData.raw = inst;
            }
            instructions.push(instructionData);
          });
        }

        // Extract compute units used
        const computeUnitsUsed = transaction.meta?.computeUnitsConsumed 
          ? BigInt(transaction.meta.computeUnitsConsumed) 
          : undefined;

        // Extract fee
        const fee = transaction.meta?.fee 
          ? BigInt(transaction.meta.fee) 
          : undefined;

        // Determine success
        const success = transaction.meta?.err === null || transaction.meta?.err === undefined;

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

            console.log(`Indexed transaction ${signature.substring(0, 8)}... (slot ${slot})`);
          } else {
            await upsertFailedTransaction({
              signature,
              slot: BigInt(slot),
              error: error || "Unknown error",
              logs,
              accounts,
              blockTime,
            });

            console.log(`Indexed failed transaction ${signature.substring(0, 8)}... (slot ${slot})`);
          }
        } catch (error: any) {
          // Ignore unique constraint errors (transaction already exists)
          if (error.code !== "P2002") {
            console.error(`Error indexing transaction ${signature}:`, error);
          }
        }
      }
    });

    stream.on("error", (err) => {
      console.log("gRPC Stream Error:", err);
    });

    stream.on("end", () => {
      console.log("⚠️ gRPC stream ended.");
    });

    stream.on("close", () => {
      console.log("🔌 gRPC stream closed.");
    });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    throw error;
  }
};
