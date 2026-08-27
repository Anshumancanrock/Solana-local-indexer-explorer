"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { TransactionChart } from "@/components/transaction-chart";
import { StatCardsSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { DataTableShell, SectionHeader } from "@/components/data-table";
import {
  PageShell,
  FadeUp,
  StaggerGrid,
  StaggerItem,
  MotionTableBody,
  MotionTableRow,
} from "@/components/motion";
import type { StatsResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Activity, ArrowRight, CheckCircle2, Layers, XCircle, Zap } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Real-time insights into the Solana local test validator"
        action={
          <Badge
            variant="outline"
            className="gap-2 rounded-full border-primary/30 bg-primary/10 px-3.5 py-1.5 text-primary font-medium panel-glow"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live
          </Badge>
        }
      />

      {loading ? (
        <StatCardsSkeleton />
      ) : stats ? (
        <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <StatCard
              label="Total Transactions"
              value={stats.totalTransactions.toLocaleString()}
              icon={Zap}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Failed Transactions"
              value={stats.totalFailed.toLocaleString()}
              icon={XCircle}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Success Rate"
              value={`${stats.successRate}%`}
              icon={CheckCircle2}
              trend={{ value: "Good", isPositive: stats.successRate > 80 }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              label="Latest Slot"
              value={stats.latestSlot.toLocaleString()}
              icon={Layers}
            />
          </StaggerItem>
        </StaggerGrid>
      ) : (
        <FadeUp>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive glass">
            Failed to load stats data. Is the backend running?
          </div>
        </FadeUp>
      )}

      <TransactionChart />

      <div className="space-y-4">
        <SectionHeader
          icon={Activity}
          title="Recent Transactions"
          action={
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="group gap-1.5 rounded-xl text-muted-foreground hover:text-primary"
            >
              <Link href="/transactions">
                View all
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          }
        />

        {loading ? (
          <TableSkeleton />
        ) : stats ? (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40 bg-muted/20">
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
              <MotionTableBody>
                {stats.recentTransactions.map((tx) => (
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
                              className="text-primary hover:underline underline-offset-4 transition-colors"
                            >
                              {tx.signature.slice(0, 16)}...
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
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {tx.blockTime ? (
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            {getRelativeTime(tx.blockTime)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(tx.blockTime).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </MotionTableRow>
                ))}
              </MotionTableBody>
            </Table>
          </DataTableShell>
        ) : null}
      </div>
    </PageShell>
  );
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
