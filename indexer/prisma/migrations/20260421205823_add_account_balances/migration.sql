-- CreateTable
CREATE TABLE "AccountBalance" (
    "id" TEXT NOT NULL,
    "accountAddress" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountIndex" INTEGER NOT NULL,
    "preBalance" BIGINT NOT NULL,
    "postBalance" BIGINT NOT NULL,
    "balanceChange" BIGINT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3),

    CONSTRAINT "AccountBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountBalance_accountAddress_idx" ON "AccountBalance"("accountAddress");

-- CreateIndex
CREATE INDEX "AccountBalance_accountAddress_slot_idx" ON "AccountBalance"("accountAddress", "slot");

-- CreateIndex
CREATE INDEX "AccountBalance_transactionId_idx" ON "AccountBalance"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountBalance_transactionId_accountIndex_key" ON "AccountBalance"("transactionId", "accountIndex");

-- AddForeignKey
ALTER TABLE "AccountBalance" ADD CONSTRAINT "AccountBalance_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
