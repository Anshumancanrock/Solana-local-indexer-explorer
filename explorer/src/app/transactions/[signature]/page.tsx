"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge } from "@/components/status-badge";
import { DetailCardSkeleton } from "@/components/loading-skeleton";
import { FadeUp, PageShell } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Braces,
  ChevronRight,
  FileText,
  Info,
  Layers,
  TerminalSquare,
  Zap,
  XCircle,
} from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const signature = params.signature as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/transactions/${signature}`)
      .then((res) => {
        if (!res.ok) throw new Error("Transaction not found");
        return res.json();
      })
      .then(setTx)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [signature]);

  if (loading) return <DetailCardSkeleton />;
  if (error)
    return (
      <FadeUp>
        <div className="rounded-xl border border-destructive/40 bg-destructive/8 p-12 text-center text-destructive">
          <Info className="h-8 w-8 mx-auto mb-4 opacity-50" />
          <h3 className="font-heading font-semibold text-lg">{error}</h3>
          <p className="opacity-80 text-sm">Check the signature and try again.</p>
          <Button variant="outline" asChild className="mt-4" size="sm">
            <Link href="/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </FadeUp>
    );

  return (
    <PageShell className="space-y-6">
      <FadeUp>
        <nav className="flex items-center text-sm text-muted-foreground gap-1.5">
          <Link
            href="/transactions"
            className="hover:text-primary transition-colors"
          >
            Transactions
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-mono text-xs max-w-[200px] md:max-w-none">
            {signature}
          </span>
        </nav>
      </FadeUp>

      <FadeUp delay={0.04}>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon-sm" asChild className="shrink-0">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-1">
              Transaction
            </p>
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-gradient">
              Transaction Detail
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Slot {tx.slot.toLocaleString()}
            </p>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.08}>
        <Card className="overflow-hidden glass-strong border-gradient panel-glow relative">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
              <DetailRow label="Signature" icon={FileText}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs break-all leading-relaxed">
                    {tx.signature}
                  </span>
                  <CopyButton value={tx.signature} />
                </div>
              </DetailRow>

              <DetailRow label="Status" icon={Info}>
                <StatusBadge success={tx.success !== false} />
              </DetailRow>

              <DetailRow label="Slot" icon={Layers}>
                <span className="font-mono tabular-nums">{tx.slot.toLocaleString()}</span>
              </DetailRow>

              <DetailRow label="Time" icon={Info}>
                <span className="text-sm">
                  {tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "N/A"}
                </span>
              </DetailRow>

              <DetailRow label="Fee" icon={Zap}>
                <span className="font-mono tabular-nums text-sm">
                  {tx.fee ? `${(parseInt(tx.fee) / 1e9).toFixed(9)} SOL` : "N/A"}
                </span>
              </DetailRow>

              <DetailRow label="Compute Units" icon={TerminalSquare}>
                <span className="font-mono tabular-nums text-sm">
                  {tx.computeUnitsUsed
                    ? parseInt(tx.computeUnitsUsed).toLocaleString()
                    : "N/A"}
                </span>
              </DetailRow>

              {tx.error && (
                <DetailRow
                  label="Error"
                  icon={XCircle}
                  className="col-span-1 md:col-span-2"
                >
                  <pre className="break-words font-mono text-xs p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-destructive overflow-auto max-w-full">
                    {tx.error}
                  </pre>
                </DetailRow>
              )}

              {tx.errorCode && (
                <DetailRow label="Error Code" icon={XCircle}>
                  <Badge variant="outline" className="font-mono text-destructive border-destructive/25">
                    {tx.errorCode}
                  </Badge>
                </DetailRow>
              )}
            </div>

            <Separator className="bg-border/50" />

            <div className="p-6 bg-muted/15">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Accounts
                <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                  {tx.accounts?.length ?? 0}
                </Badge>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {tx.accounts?.map((acct: string, i: number) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <Link
                      href={`/accounts/${acct}`}
                      className="font-mono text-xs text-primary hover:underline truncate mr-2"
                    >
                      {acct}
                    </Link>
                    <CopyButton value={acct} />
                  </div>
                ))}
              </div>
            </div>

            {tx.instructions && (
              <>
                <Separator className="bg-border/50" />
                <div className="p-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Braces className="h-4 w-4 text-primary" />
                    Instructions
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs font-mono">
                      {tx.instructions?.length ?? 0}
                    </Badge>
                  </h3>
                  <ScrollArea className="max-h-96 rounded-lg border border-border/50">
                    <pre className="text-xs text-primary/90 bg-muted/30 p-4 font-mono leading-relaxed">
                      {JSON.stringify(tx.instructions, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </>
            )}

            {tx.memos && tx.memos.length > 0 && (
              <>
                <Separator className="bg-border/50" />
                <div className="p-6 bg-muted/15">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Memos
                  </h3>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {tx.memos.map((memo: any) => (
                      <div
                        key={memo.id}
                        className="text-sm text-foreground bg-primary/5 p-3 rounded-lg border border-primary/15"
                      >
                        {memo.content}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tx.logs && tx.logs.length > 0 && (
              <>
                <Separator className="bg-border/50" />
                <div className="p-6">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-primary" />
                    Execution Logs
                  </h3>
                  <ScrollArea className="max-h-64 rounded-lg border border-border/50">
                    <pre className="text-xs text-muted-foreground bg-[oklch(0.08_0.01_160)] dark:bg-black/60 p-4 font-mono leading-relaxed">
                      {tx.logs.join("\n")}
                    </pre>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeUp>
    </PageShell>
  );
}

function DetailRow({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
