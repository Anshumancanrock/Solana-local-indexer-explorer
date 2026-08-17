"use client";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

export const spring = {
  snappy: { type: "spring" as const, stiffness: 420, damping: 32 },
  gentle: { type: "spring" as const, stiffness: 280, damping: 28 },
  soft: { type: "spring" as const, stiffness: 200, damping: 26 },
  bouncy: { type: "spring" as const, stiffness: 500, damping: 22 },
};

export const TIMING = {
  page: 0,
  header: 0.05,
  stats: 0.1,
  chart: 0.18,
  table: 0.24,
  row: 0.03,
} as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const tableRowStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const tableRowItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

function useMotionSafe() {
  return useReducedMotion();
}

export function MotionDiv({
  className,
  reduced = true,
  ...props
}: HTMLMotionProps<"div"> & { reduced?: boolean }) {
  const prefersReduced = useMotionSafe();
  if (reduced && prefersReduced) {
    const { initial, animate, exit, transition, variants, whileHover, whileTap, ...rest } =
      props;
    void initial;
    void animate;
    void exit;
    void transition;
    void variants;
    void whileHover;
    void whileTap;
    return <div className={className} {...(rest as React.ComponentProps<"div">)} />;
  }
  return <motion.div className={className} {...props} />;
}

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={cn("space-y-8", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("space-y-8", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-48px" }}
      variants={fadeUp}
      transition={{ ...spring.gentle, delay }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={scaleIn}
      transition={spring.gentle}
      whileHover={{ y: -4, transition: spring.snappy }}
    >
      {children}
    </motion.div>
  );
}

export function MotionTableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <tbody className={className}>{children}</tbody>;
  }

  return (
    <motion.tbody
      className={className}
      initial="hidden"
      animate="visible"
      variants={tableRowStagger}
    >
      {children}
    </motion.tbody>
  );
}

export function MotionTableRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <tr className={className}>{children}</tr>;
  }

  return (
    <motion.tr
      className={className}
      variants={tableRowItem}
      transition={spring.soft}
    >
      {children}
    </motion.tr>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, transition: spring.snappy }}
      whileTap={{ scale: 0.995, transition: spring.snappy }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div className={className} layout>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function AnimatedPresenceItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReduced = useMotionSafe();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={spring.gentle}
      layout
    >
      {children}
    </motion.div>
  );
}
