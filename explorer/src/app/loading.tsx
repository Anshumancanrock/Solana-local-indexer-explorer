import { StatCardsSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted/30 animate-pulse" />
      </div>
      <StatCardsSkeleton />
    </div>
  );
}
