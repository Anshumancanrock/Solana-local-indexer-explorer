"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AmbientBackground() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Base grid */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, black 20%, transparent 75%)",
        }}
      />

      {/* Aurora orbs */}
      <div
        className={cn(
          "absolute -top-[30%] left-[10%] h-[55vh] w-[55vh] rounded-full blur-[100px]",
          !prefersReduced && "animate-aurora"
        )}
        style={{ background: "var(--glow-a)" }}
      />
      <div
        className={cn(
          "absolute -top-[20%] right-[5%] h-[45vh] w-[45vh] rounded-full blur-[90px]",
          !prefersReduced && "animate-aurora-delayed"
        )}
        style={{ background: "var(--glow-b)" }}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 h-[30vh] w-[70vw] rounded-full blur-[120px] opacity-50",
          !prefersReduced && "animate-pulse-glow"
        )}
        style={{ background: "var(--glow-a)" }}
      />

      {/* Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/30 to-background" />
    </div>
  );
}
