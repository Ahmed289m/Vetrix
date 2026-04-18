"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally left empty: boundary should not fail silently.
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-2xl border border-border/30 bg-card/60 p-6 text-center space-y-3">
        <h2 className="text-xl font-bold">Failed to load this page.</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald px-4 text-sm font-semibold text-white hover:bg-emerald/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
