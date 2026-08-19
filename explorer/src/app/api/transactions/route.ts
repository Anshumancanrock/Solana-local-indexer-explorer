import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parsePagination, totalPages } from "@/lib/pagination";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

const TRANSACTION_ORDER: Prisma.TransactionOrderByWithRelationInput[] = [
  { slot: "desc" },
  { transactionIndex: "desc" },
  { signature: "desc" },
];

// ?status=all|success|failed (default all) - failures live in Transaction now.
function parseStatus(raw: string | null): "all" | "success" | "failed" {
  return raw === "success" || raw === "failed" ? raw : "all";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = parseStatus(searchParams.get("status"));

    const where: Prisma.TransactionWhereInput =
      status === "all" ? {} : { success: status === "success" };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: TRANSACTION_ORDER,
        skip,
        take: limit,
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
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json(
      serializeBigInts({
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: totalPages(total, limit),
        },
      })
    );
  } catch (error) {
    console.error("Transaction list error:", error);
    return NextResponse.json(
      { error: "Failed to load transactions" },
      { status: 500 }
    );
  }
}
