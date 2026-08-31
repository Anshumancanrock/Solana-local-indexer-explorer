"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { DetailCardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { PaginationControls } from "@/components/pagination-controls";
import { DataTableShell, SectionHeader } from "@/components/data-table";
import {
  PageShell,
  FadeUp,
  MotionTableBody,
  MotionTableRow,
} from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Filter, History, Link as LinkIcon, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

function AccountDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const address = params.address as string;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const field = searchParams.get("field") || "postBalance";
  const amount = searchParams.get("amount") || "";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";
  const unit = searchParams.get("unit") === "lamports" ? "lamports" : "sol";

  const [fieldValue, setFieldValue] = useState(field);
  const [unitValue, setUnitValue] = useState(unit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFieldValue(field);
    setUnitValue(unit);
  }, [field, unit]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (field) params.set("field", field);
    if (unit) params.set("unit", unit);
    if (amount.trim()) {
      params.set("amount", amount.trim());
    } else {
      if (minAmount.trim()) params.set("minAmount", minAmount.trim());
      if (maxAmount.trim()) params.set("maxAmount", maxAmount.trim());
    }

    fetch(`/api/accounts/${address}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Account not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, page, field, amount, minAmount, maxAmount, unit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="space-y-6">
        <DetailCardSkeleton />
        <TableSkeleton />
      </div>
    );

  if (error)
    return (
      <FadeUp>
        <div className="rounded-xl border border-destructive/40 bg-destructive/8 p-12 text-center text-destructive">
          <Wallet className="h-8 w-8 mx-auto mb-4 opacity-50" />
          <h3 className="font-heading font-semibold text-lg">{error}</h3>
          <p className="opacity-80 mt-2 text-sm max-w-md mx-auto">
            Checking an account requires it to have been involved in a transaction
            during indexing.
          </p>
          <Button variant="outline" asChild className="mt-4" size="sm">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </FadeUp>
    );

  return (
    <PageShell className="space-y-6">
      <FadeUp>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon-sm" asChild className="shrink-0 rounded-xl">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-1">
              Account
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-gradient">
              Account Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Balance history and transaction involvement
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.05}>
        <Card className="overflow-hidden glass-strong border-gradient panel-glow">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
              <div className="space-y-2 min-w-0">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Address
                </span>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-base md:text-lg font-semibold tracking-tight break-all">
                    {data.account.address}
                  </span>
                  <CopyButton value={data.account.address} />
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-primary/25 bg-primary/10 px-6 py-4 md:text-right panel-glow">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current Balance
                </span>
                <div className="font-heading text-2xl md:text-3xl font-bold text-primary tabular-nums mt-1">
                  {(parseInt(data.latestBalance) / 1e9).toFixed(9)}{" "}
                  <span className="text-base font-semibold text-primary/70">SOL</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" /> Total Transactions
                </span>
                <p className="font-mono text-base tabular-nums">
                  {data.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> First Seen
                </span>
                <p className="text-sm">
                  {new Date(data.account.firstSeen).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Last Seen
                </span>
                <p className="text-sm">
                  {new Date(data.account.lastSeen).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeUp>

      <div className="space-y-4">
        <SectionHeader icon={History} title="Balance History" />

        <FadeUp delay={0.12}>
          <form className="rounded-2xl border border-border/40 glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter balances</span>
            </div>
            <input type="hidden" name="field" value={fieldValue} />
            <input type="hidden" name="unit" value={unitValue} />
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="field-select" className="text-xs text-muted-foreground">
                  Field
                </Label>
                <Select value={fieldValue} onValueChange={setFieldValue}>
                  <SelectTrigger id="field-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postBalance">Post Balance</SelectItem>
                    <SelectItem value="preBalance">Pre Balance</SelectItem>
                    <SelectItem value="balanceChange">Balance Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-select" className="text-xs text-muted-foreground">
                  Unit
                </Label>
                <Select value={unitValue} onValueChange={setUnitValue}>
                  <SelectTrigger id="unit-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sol">SOL</SelectItem>
                    <SelectItem value="lamports">Lamports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs text-muted-foreground">
                  Exact Amount
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="any"
                  defaultValue={amount}
                  placeholder="e.g. 1.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minAmount" className="text-xs text-muted-foreground">
                  Min Amount
                </Label>
                <Input
                  id="minAmount"
                  name="minAmount"
                  type="number"
                  step="any"
                  defaultValue={minAmount}
                  placeholder="e.g. 0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount" className="text-xs text-muted-foreground">
                  Max Amount
                </Label>
                <Input
                  id="maxAmount"
                  name="maxAmount"
                  type="number"
                  step="any"
                  defaultValue={maxAmount}
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm">
                Apply Filter
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/accounts/${address}`}>Clear</Link>
              </Button>
            </div>
          </form>
        </FadeUp>

        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20 border-border/50">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Transaction
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slot
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pre Balance (SOL)
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Post Balance (SOL)
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Change
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <MotionTableBody key={page}>
              {data.balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No balance history found.
                  </TableCell>
                </TableRow>
              ) : (
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                data.balances.map((bal: any) => {
                  const change = parseInt(bal.balanceChange);
                  const isPositive = change > 0;
                  const isNegative = change < 0;

                  return (
                    <MotionTableRow
                      key={bal.id}
                      className="border-border/30 hover:bg-muted/25 transition-colors"
                    >
                      <TableCell className="font-mono">
                        <Link
                          href={`/transactions/${bal.transaction.signature}`}
                          className="text-primary hover:underline underline-offset-2"
                        >
                          {bal.transaction.signature.slice(0, 16)}...
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        {parseInt(bal.slot).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {(parseInt(bal.preBalance) / 1e9).toFixed(9)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {(parseInt(bal.postBalance) / 1e9).toFixed(9)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            isPositive &&
                              "border-primary/25 bg-primary/10 text-primary",
                            isNegative &&
                              "border-destructive/25 bg-destructive/10 text-destructive",
                            !isPositive &&
                              !isNegative &&
                              "text-muted-foreground"
                          )}
                        >
                          {isPositive ? "+" : ""}
                          {(change / 1e9).toFixed(9)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {bal.blockTime ? new Date(bal.blockTime).toLocaleString() : "-"}
                      </TableCell>
                    </MotionTableRow>
                  );
                })
              )}
            </MotionTableBody>
          </Table>
        </DataTableShell>

        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          basePath={`/accounts/${address}`}
        />
      </div>
    </PageShell>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <DetailCardSkeleton />
          <TableSkeleton />
        </div>
      }
    >
      <AccountDetail />
    </Suspense>
  );
}
