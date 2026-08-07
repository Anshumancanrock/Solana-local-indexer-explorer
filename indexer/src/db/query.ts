import { prisma } from "./client";

// ─── Transaction Writes ─────────────────────────────────────────────

export async function upsertTransaction(data: {
  signature: string;
  slot: bigint;
  blockTime: Date;
  success: boolean;
  fee?: bigint;
  computeUnitsUsed?: bigint;
  accounts: string[];
  instructions: any[];
  preBalances: (number | bigint)[];
  postBalances: (number | bigint)[];
}) {
  const tx = await (prisma.transaction as any).upsert({
    where: { signature: data.signature },
    update: {
      slot: data.slot,
      blockTime: data.blockTime,
      success: data.success,
      fee: data.fee,
      computeUnitsUsed: data.computeUnitsUsed,
      accounts: data.accounts,
      instructions: data.instructions,
    },
    create: {
      signature: data.signature,
      slot: data.slot,
      blockTime: data.blockTime,
      success: data.success,
      fee: data.fee,
      computeUnitsUsed: data.computeUnitsUsed,
      accounts: data.accounts,
      instructions: data.instructions,
    },
  });

  // Store balance changes for each account
  if (data.preBalances.length > 0 && data.postBalances.length > 0) {
    const balancePromises = data.accounts.map(async (address, index) => {
      if (index < data.preBalances.length && index < data.postBalances.length) {
        const preBalance = BigInt(data.preBalances[index]);
        const postBalance = BigInt(data.postBalances[index]);
        const balanceChange = postBalance - preBalance;

        return (prisma.accountBalance as any).upsert({
          where: {
            transactionId_accountIndex: {
              transactionId: tx.id,
              accountIndex: index,
            },
          },
          update: {
            preBalance,
            postBalance,
            balanceChange,
          },
          create: {
            accountAddress: address,
            transactionId: tx.id,
            accountIndex: index,
            preBalance,
            postBalance,
            balanceChange,
            slot: data.slot,
            blockTime: data.blockTime,
          },
        });
      }
    });

    await Promise.all(balancePromises);
  }

  return tx;
}

export async function upsertFailedTransaction(data: {
  signature: string;
  slot: bigint;
  error: string;
  logs: string[];
  accounts: string[];
  blockTime: Date;
}) {
  return (prisma as any).failedTransaction.upsert({
    where: { signature: data.signature },
    update: {
      slot: data.slot,
      error: data.error,
      logs: data.logs,
      accounts: data.accounts,
      blockTime: data.blockTime,
    },
    create: {
      signature: data.signature,
      slot: data.slot,
      error: data.error,
      logs: data.logs,
      accounts: data.accounts,
      blockTime: data.blockTime,
    },
  });
}

// ─── Account Writes ─────────────────────────────────────────────────

export async function upsertAccountsForTransaction(
  transactionId: string,
  accounts: string[]
) {
  for (const address of accounts) {
    const account = await prisma.account.upsert({
      where: { address },
      update: {}, // lastSeen updates automatically via @updatedAt
      create: { address },
    });

    await prisma.accountTransaction.upsert({
      where: {
        accountId_transactionId: {
          accountId: account.id,
          transactionId,
        },
      },
      update: {},
      create: {
        accountId: account.id,
        transactionId,
      },
    });
  }
}
