import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/motion";

export function DataTableShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FadeUp delay={0.12}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border/40 glass-strong panel-glow",
          className
        )}
      >
        {children}
      </div>
    </FadeUp>
  );
}

export function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <FadeUp delay={0.1}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
    </FadeUp>
  );
}
