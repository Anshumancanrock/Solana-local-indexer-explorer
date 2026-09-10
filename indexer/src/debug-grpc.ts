import Client, {
  CommitmentLevel,
  SubscribeRequest,
} from "@triton-one/yellowstone-grpc";
import { inspect } from "util";
import * as fs from "fs";

const YELLOWSTONE_ADDR = process.env.YELLOWSTONE_ADDR || "localhost:10000";
const YELLOWSTONE_XTOKEN = process.env.YELLOWSTONE_XTOKEN || null;
const LOG_FILE = process.env.LOG_FILE || "grpc-responses.log";

// The Client expects a full URL (it parses it to extract hostname and port)
let endpoint = YELLOWSTONE_ADDR;
if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
  endpoint = `http://${endpoint}`;
}

console.log("Connecting to Yellowstone gRPC:", endpoint);
console.log("Logging responses to:", LOG_FILE);

const client = new Client(
  endpoint,
  YELLOWSTONE_XTOKEN || undefined,
  {
    "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MB
  }
);

async function main() {
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
      stream.write(request, (err: unknown) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    });

    console.log("Subscribed to slots and transactions");
    console.log("Waiting for data... (Press Ctrl+C to stop)\n");

    let messageCount = 0;
    const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

    stream.on("data", (data: any) => {
      messageCount++;
      const timestamp = new Date().toISOString();
      const logEntry = {
        messageNumber: messageCount,
        timestamp,
        dataType: data.slot ? "slot" : data.transaction ? "transaction" : "unknown",
        data: data,
      };

      // Log to console (pretty printed, truncated)
      console.log(`\n[${messageCount}] ${timestamp}`);
      console.log(`Type: ${logEntry.dataType}`);
      
      if (data.slot) {
        console.log("Slot Update:");
        console.log(inspect(data.slot, { depth: 3, colors: true, maxArrayLength: 5 }));
      }
      
      if (data.transaction) {
        console.log("Transaction Update:");
        console.log("  Slot:", data.transaction.slot);
        console.log("  Signature type:", typeof data.transaction.transaction?.signature);
        console.log("  Signature value:", 
          data.transaction.transaction?.signature instanceof Uint8Array 
            ? `Uint8Array(${data.transaction.transaction.signature.length} bytes)`
            : data.transaction.transaction?.signature
        );
        console.log("  Transaction keys:", Object.keys(data.transaction.transaction || {}));
        console.log(inspect(data.transaction, { depth: 4, colors: true, maxArrayLength: 3, maxStringLength: 200 }));
      }

      // Log full data to file (JSON)
      logStream.write(JSON.stringify(logEntry, null, 2) + "\n\n");
    });

    stream.on("error", (err) => {
      console.error("gRPC Stream Error:", err);
      logStream.write(`\nERROR: ${JSON.stringify(err, null, 2)}\n\n`);
    });

    stream.on("end", () => {
      console.log("⚠️ gRPC stream ended.");
      logStream.end();
    });

    stream.on("close", () => {
      console.log("🔌 gRPC stream closed.");
      logStream.end();
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\n🛑 Stopping...");
      console.log(`Total messages received: ${messageCount}`);
      logStream.end();
      process.exit(0);
    });

  } catch (error) {
    console.error("Failed to subscribe:", error);
    process.exit(1);
  }
}

main();

