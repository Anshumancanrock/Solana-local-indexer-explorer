import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="glass border-border/30 overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-3 w-24 bg-primary/10" />
              <Skeleton className="h-8 w-28 bg-primary/15" />
              <Skeleton className="h-3 w-20 bg-muted" />
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 glass-strong">
      <div className="h-11 border-b border-border/40 bg-muted/20 px-4 flex items-center gap-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 max-w-[80px] bg-primary/10" />
          ))}
      </div>
      <div className="divide-y divide-border/30">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-40 bg-muted" />
              <Skeleton className="h-4 w-16 bg-muted" />
              <Skeleton className="h-5 w-16 rounded-full bg-primary/10" />
              <Skeleton className="h-4 w-20 ml-auto bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
            </div>
          ))}
      </div>
    </div>
  );
}

export function DetailCardSkeleton() {
  return (
    <Card className="glass border-border/30 p-6">
      <div className="space-y-5">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-3 w-28 bg-primary/10" />
              <Skeleton className="h-5 w-full max-w-md bg-muted" />
            </div>
          ))}
      </div>
    </Card>
  );
}
