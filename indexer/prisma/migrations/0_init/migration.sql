-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "fee" BIGINT,
    "computeUnitsUsed" BIGINT,
    "accounts" TEXT[],
    "instructions" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FailedTransaction" (
    "id" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "error" TEXT NOT NULL,
    "errorCode" TEXT,
    "logs" TEXT[],
    "accounts" TEXT[],
    "blockTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_signature_key" ON "Transaction"("signature");

-- CreateIndex
CREATE INDEX "Transaction_slot_idx" ON "Transaction"("slot");

-- CreateIndex
CREATE INDEX "Transaction_success_idx" ON "Transaction"("success");

-- CreateIndex
CREATE INDEX "Transaction_blockTime_idx" ON "Transaction"("blockTime");

-- CreateIndex
CREATE INDEX "Memo_content_idx" ON "Memo"("content");

-- CreateIndex
CREATE UNIQUE INDEX "FailedTransaction_signature_key" ON "FailedTransaction"("signature");

-- CreateIndex
CREATE INDEX "FailedTransaction_error_idx" ON "FailedTransaction"("error");

-- CreateIndex
CREATE INDEX "FailedTransaction_errorCode_idx" ON "FailedTransaction"("errorCode");

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;


