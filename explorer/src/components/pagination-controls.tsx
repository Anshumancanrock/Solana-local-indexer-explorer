"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { FadeUp } from "@/components/motion";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  basePath,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <FadeUp delay={0.15}>
      <div className="flex items-center justify-between rounded-2xl border border-border/40 glass px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Page{" "}
          <span className="font-medium tabular-nums text-foreground">{page}</span>{" "}
          of{" "}
          <span className="font-medium tabular-nums text-foreground">
            {totalPages}
          </span>
          <span className="ml-1 opacity-60">({total.toLocaleString()} total)</span>
        </p>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </FadeUp>
  );
}
