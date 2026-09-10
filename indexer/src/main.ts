import { execSync } from "child_process";
import { startIndexer, stopIndexer } from "./indexer";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigrations(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Running database migrations (attempt ${attempt}/${retries})...`);
      execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
      console.log("Migrations completed");
      return;
    } catch (error) {
      if (attempt === retries) {
        console.error("Migration failed after all retries:", error);
        process.exit(1);
      }
      console.log(`Database not ready, retrying in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }
  }
}

function installShutdownHandlers() {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down...`);
      stopIndexer();
    });
  }

  // Anything that escapes the reconnect loop leaves the process unable to
  // index, so exit non-zero and let the restart policy take over rather than
  // idling in a broken state.
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    process.exit(1);
  });
}

async function main() {
  console.log("Starting Solana Indexer...");

  installShutdownHandlers();

  // Run migrations on startup with retries
  await runMigrations();

  // Start the indexer. This only returns on shutdown; every stream failure is
  // retried internally.
  try {
    await startIndexer();
    console.log("Indexer stopped");
  } catch (error) {
    console.error("Indexer failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
