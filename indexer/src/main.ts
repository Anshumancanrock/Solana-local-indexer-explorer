import { execSync } from "child_process";
import { startIndexer } from "./indexer";

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

async function main() {
  console.log("Starting Solana Indexer...");

  // Run migrations on startup with retries
  await runMigrations();
  
  // Start the indexer
  try {
    await startIndexer();
  } catch (error) {
    console.error("Indexer failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
