"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const prefersReduced = useReducedMotion();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-primary"
          onClick={copyToClipboard}
        >
          {copied ? (
            prefersReduced ? (
              <Check className="h-3 w-3 text-primary" />
            ) : (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="h-3 w-3 text-primary" />
              </motion.span>
            )
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span className="sr-only">Copy</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {copied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
}
