import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SEARCH_MIN_QUERY_LENGTH } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [transactions, accounts] = await Promise.all([
      prisma.transaction.findMany({
        where: { signature: { startsWith: q } },
        take: 3,
        select: { signature: true },
      }),
      prisma.account.findMany({
        where: { address: { startsWith: q } },
        take: 3,
        select: { address: true },
      }),
    ]);

    const results = [
      ...transactions.map((t: { signature: string }) => ({ type: "transaction", value: t.signature })),
      ...accounts.map((a: { address: string }) => ({ type: "account", value: a.address }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] });
  }
}
