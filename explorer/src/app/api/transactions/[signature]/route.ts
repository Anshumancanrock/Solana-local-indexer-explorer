import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInts } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ signature: string }> }
) {
  try {
    const { signature } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { signature },
      include: { memos: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeBigInts(transaction));
  } catch (error) {
    console.error("Transaction detail error:", error);
    return NextResponse.json(
      { error: "Failed to load transaction" },
      { status: 500 }
    );
  }
}
