/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

type AnyProps = Record<string, any>;

const MOTION_KEYS_TO_STRIP = new Set([
  // animation state
  "initial",
  "animate",
  "exit",
  "variants",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "viewport",
  // layout/identity animations
  "layout",
  "layoutId",
  // presence/drag (in case any dashboard pages use these)
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
]);

function stripMotionProps(props: AnyProps) {
  const next: AnyProps = { ...props };
  for (const key of Object.keys(next)) {
    if (MOTION_KEYS_TO_STRIP.has(key)) delete next[key];
  }
  return next;
}

// A lightweight replacement for `framer-motion` used only in dashboard routes.
// It keeps the JSX structure but removes motion animation props so React hydration
// stays stable and render cost is much lower.
export const motion: any = new Proxy(
  {},
  {
    get(_target, tag: string) {
      return React.forwardRef<HTMLElement, AnyProps>(({ ...props }, ref) => {
        const cleaned = stripMotionProps(props);
        return React.createElement(tag, { ...cleaned, ref });
      });
    },
  },
);

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

