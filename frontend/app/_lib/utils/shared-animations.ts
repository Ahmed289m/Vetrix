/**
 * Shared Framer Motion animation variants used across dashboard pages.
 * Import from here instead of redefining in each component.
 */

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
};
