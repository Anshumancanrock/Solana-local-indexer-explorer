import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

// Total order shared by every transaction list so pagination never repeats a row.
const TRANSACTION_ORDER: Prisma.TransactionOrderByWithRelationInput[] = [
  { slot: "desc" },
  { transactionIndex: "desc" },
  { signature: "desc" },
];

export async function GET() {
  try {
    const [totalSuccessful, totalFailed, latestTx, recentTransactions] =
      await Promise.all([
        prisma.transaction.count({ where: { success: true } }),
        prisma.transaction.count({ where: { success: false } }),
        prisma.transaction.findFirst({
          orderBy: TRANSACTION_ORDER,
          select: { slot: true },
        }),
        prisma.transaction.findMany({
          orderBy: TRANSACTION_ORDER,
          take: 10,
          select: {
            id: true,
            signature: true,
            slot: true,
            transactionIndex: true,
            blockTime: true,
            success: true,
            fee: true,
          },
        }),
      ]);

    const totalTransactions = totalSuccessful + totalFailed;
    const successRate =
      totalTransactions > 0 ? (totalSuccessful / totalTransactions) * 100 : 0;

    return NextResponse.json(
      serializeBigInts({
        totalTransactions,
        totalSuccessful,
        totalFailed,
        successRate: Math.round(successRate * 10) / 10,
        // Always a BigInt so serializeBigInts always yields a string ("0" when empty).
        latestSlot: latestTx?.slot ?? BigInt(0),
        recentTransactions,
      })
    );
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
