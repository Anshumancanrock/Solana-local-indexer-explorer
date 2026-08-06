-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "AccountTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_address_key" ON "Account"("address");

-- CreateIndex
CREATE INDEX "Account_address_idx" ON "Account"("address");

-- CreateIndex
CREATE INDEX "AccountTransaction_accountId_idx" ON "AccountTransaction"("accountId");

-- CreateIndex
CREATE INDEX "AccountTransaction_transactionId_idx" ON "AccountTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountTransaction_accountId_transactionId_key" ON "AccountTransaction"("accountId", "transactionId");

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
