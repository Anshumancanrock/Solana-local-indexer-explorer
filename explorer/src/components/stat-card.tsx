"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/components/motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReduced ? undefined : { y: -6 }}
      transition={spring.snappy}
    >
      <Card className="group relative overflow-hidden border-border/40 glass border-gradient transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {label}
              </p>
              <motion.p
                className="font-heading text-2xl font-bold tabular-nums tracking-tight text-gradient"
                initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
                animate={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ ...spring.gentle, delay: 0.1 }}
              >
                {value}
              </motion.p>
              {trend ? (
                <p className="text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "font-semibold",
                      trend.isPositive ? "text-success" : "text-destructive"
                    )}
                  >
                    {trend.value}
                  </span>{" "}
                  from last epoch
                </p>
              ) : (
                <div className="h-4" />
              )}
            </div>
            <motion.div
              className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"
              whileHover={prefersReduced ? undefined : { rotate: 8, scale: 1.08 }}
              transition={spring.bouncy}
            >
              <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
