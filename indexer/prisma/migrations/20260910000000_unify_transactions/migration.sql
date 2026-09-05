-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "transactionIndex" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "logs" TEXT[],
ADD COLUMN IF NOT EXISTS "error" TEXT,
ADD COLUMN IF NOT EXISTS "errorCode" TEXT;

-- Rows that predate "logs" hold SQL NULL; a Prisma scalar list must read back as an empty array.
UPDATE "Transaction" SET "logs" = ARRAY[]::TEXT[] WHERE "logs" IS NULL;

-- AlterTable
ALTER TABLE "AccountBalance" ADD COLUMN IF NOT EXISTS "transactionIndex" BIGINT NOT NULL DEFAULT 0;

-- --- Migrate FailedTransaction into Transaction ---
DO $$
BEGIN
  IF to_regclass('public."FailedTransaction"') IS NULL THEN
    RETURN;
  END IF;

  -- Each failed row keeps its cuid as the Transaction id, so the links below can join on it.
  INSERT INTO "Transaction" (
    "id", "signature", "slot", "blockTime", "success",
    "accounts", "instructions", "logs", "error", "createdAt"
  )
  SELECT
    f."id", f."signature", f."slot", f."blockTime", false,
    COALESCE(f."accounts", ARRAY[]::TEXT[]), ARRAY[]::JSONB[],
    COALESCE(f."logs", ARRAY[]::TEXT[]), f."error", f."createdAt"
  FROM "FailedTransaction" f
  ON CONFLICT ("signature") DO NOTHING;

  INSERT INTO "Account" ("id", "address", "firstSeen", "lastSeen")
  SELECT gen_random_uuid()::TEXT, a."address", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM (
    SELECT DISTINCT k."address"
    FROM "FailedTransaction" f
    JOIN "Transaction" t ON t."id" = f."id"
    CROSS JOIN LATERAL unnest(f."accounts") AS k("address")
    WHERE k."address" IS NOT NULL
  ) a
  ON CONFLICT ("address") DO NOTHING;

  INSERT INTO "AccountTransaction" ("id", "accountId", "transactionId")
  SELECT gen_random_uuid()::TEXT, acc."id", l."transactionId"
  FROM (
    SELECT DISTINCT f."id" AS "transactionId", k."address"
    FROM "FailedTransaction" f
    JOIN "Transaction" t ON t."id" = f."id"
    CROSS JOIN LATERAL unnest(f."accounts") AS k("address")
    WHERE k."address" IS NOT NULL
  ) l
  JOIN "Account" acc ON acc."address" = l."address"
  ON CONFLICT ("accountId", "transactionId") DO NOTHING;
END
$$;

-- DropTable
DROP TABLE IF EXISTS "FailedTransaction";

-- DropIndex
DROP INDEX IF EXISTS "AccountBalance_accountAddress_slot_idx";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_slot_transactionIndex_idx" ON "Transaction"("slot", "transactionIndex");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_errorCode_idx" ON "Transaction"("errorCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Memo_transactionId_idx" ON "Memo"("transactionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccountBalance_accountAddress_slot_transactionIndex_idx" ON "AccountBalance"("accountAddress", "slot", "transactionIndex");
