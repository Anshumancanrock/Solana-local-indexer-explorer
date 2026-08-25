import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusBadge({ success }: { success: boolean }) {
  if (success) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border-success/30 bg-success/10 font-mono text-[11px] text-success",
          "shadow-[0_0_12px_-4px_var(--success)]"
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-destructive/30 bg-destructive/10 font-mono text-[11px] text-destructive"
    >
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}
