import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  eyebrow?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  eyebrow,
}: PageHeaderProps) {
  return (
    <FadeUp
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-gradient">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </FadeUp>
  );
}
