"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { TableSkeleton } from "@/components/loading-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
import { PageHeader } from "@/components/page-header";
import { DataTableShell } from "@/components/data-table";
import {
  PageShell,
  FadeUp,
  MotionTableBody,
  MotionTableRow,
} from "@/components/motion";
import type { TransactionListResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, ListFilter } from "lucide-react";

function TransactionsList() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(
    (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      fetch(`/api/transactions?page=${page}&limit=20`)
        .then((res) => res.json())
        .then((d) => {
          setData(d);
          setLastUpdated(new Date());
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [page]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageShell className="space-y-6">
      <PageHeader
        eyebrow="Ledger"
        title="All Transactions"
        description="Browse the complete history of ledger transactions"
        action={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:inline tabular-nums">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-border/50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : !data ? (
        <FadeUp>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-12 text-center text-destructive glass">
            <ListFilter className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <h3 className="font-heading font-semibold">Failed to load transactions</h3>
            <p className="text-sm mt-1 mb-4 opacity-80">
              There was an error communicating with the API.
            </p>
            <Button onClick={() => fetchData(true)} variant="outline" size="sm" className="rounded-xl">
              Try again
            </Button>
          </div>
        </FadeUp>
      ) : (
        <>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/20 border-border/40">
                  <TableHead className="w-[300px] text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Signature
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Slot
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Fee (SOL)
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <MotionTableBody key={page}>
                {data.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.transactions.map((tx) => (
                    <MotionTableRow
                      key={tx.id}
                      className="group border-border/30 hover:bg-muted/25 transition-colors"
                    >
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/transactions/${tx.signature}`}
                                className="text-primary hover:underline underline-offset-4"
                              >
                                {tx.signature.slice(0, 20)}...
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent className="font-mono text-xs max-w-sm break-all">
                              {tx.signature}
                            </TooltipContent>
                          </Tooltip>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <CopyButton value={tx.signature} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        {parseInt(tx.slot).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge success={tx.success} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {tx.fee ? (parseInt(tx.fee) / 1e9).toFixed(9) : "0.000000000"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "-"}
                      </TableCell>
                    </MotionTableRow>
                  ))
                )}
              </MotionTableBody>
            </Table>
          </DataTableShell>

          <PaginationControls
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            basePath="/transactions"
          />
        </>
      )}
    </PageShell>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TransactionsList />
    </Suspense>
  );
}
