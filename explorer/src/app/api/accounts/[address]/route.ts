import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

const LAMPORTS_PER_SOL = 1_000_000_000;

// Amounts can be provided either in SOL (default, matching the UI) or in raw
// lamports via `unit=lamports`. SOL values are converted to lamports BigInts.
function parseAmount(value: string | null, unit: string): bigint | null {
  if (value === null || value.trim() === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (unit === "lamports") return BigInt(Math.round(num));
  return BigInt(Math.round(num * LAMPORTS_PER_SOL));
}

// Which AccountBalance column an amount search targets.
const AMOUNT_FIELDS = new Set(["postBalance", "preBalance", "balanceChange"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  // --- Amount search ---------------------------------------------------------
  // ?field=postBalance|preBalance|balanceChange (default postBalance)
  // ?amount=N            exact match
  // ?minAmount=N         lower bound (inclusive)
  // ?maxAmount=N         upper bound (inclusive)
  // ?unit=sol|lamports   how to interpret the values above (default sol)
  const requestedField = searchParams.get("field") || "postBalance";
  const field = AMOUNT_FIELDS.has(requestedField) ? requestedField : "postBalance";
  const unit = searchParams.get("unit") === "lamports" ? "lamports" : "sol";

  const exact = parseAmount(searchParams.get("amount"), unit);
  const min = parseAmount(searchParams.get("minAmount"), unit);
  const max = parseAmount(searchParams.get("maxAmount"), unit);

  const amountFilter: Record<string, bigint> = {};
  if (exact !== null) {
    amountFilter.equals = exact;
  } else {
    if (min !== null) amountFilter.gte = min;
    if (max !== null) amountFilter.lte = max;
  }

  const where: Record<string, unknown> = { accountAddress: address };
  if (Object.keys(amountFilter).length > 0) {
    where[field] = amountFilter;
  }

  const account = await prisma.account.findUnique({
    where: { address },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const [balances, totalBalances, latest, stats] = await Promise.all([
    (prisma.accountBalance as any).findMany({
      where,
      orderBy: { slot: "desc" },
      skip,
      take: limit,
      include: {
        transaction: {
          select: {
            signature: true,
            success: true,
            fee: true,
          },
        },
      },
    }),
    (prisma.accountBalance as any).count({
      where,
    }),
    (prisma.accountBalance as any).findFirst({
      where: { accountAddress: address },
      orderBy: { slot: "desc" },
      select: { postBalance: true },
    }),
    (prisma.accountBalance as any).aggregate({
      where,
      _sum: {
        balanceChange: true,
      },
      _count: true,
    }),
  ]);

  const latestBalance = latest?.postBalance ?? BigInt(0);
  const isFiltered = Object.keys(amountFilter).length > 0;

  return NextResponse.json(
    serializeBigInts({
      account,
      latestBalance,
      totalTransactions: totalBalances,
      totalBalanceChange: stats._sum.balanceChange || BigInt(0),
      balances,
      filter: isFiltered
        ? {
            field,
            unit,
            amount: exact,
            minAmount: min,
            maxAmount: max,
          }
        : null,
      pagination: {
        page,
        limit,
        total: totalBalances,
        totalPages: Math.ceil(totalBalances / limit),
      },
    })
  );
}
