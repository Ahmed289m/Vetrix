"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="w-full min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border/30 bg-card/60 p-6 text-center space-y-3">
        <h2 className="text-lg font-bold">Failed to load dashboard data.</h2>
        <p className="text-sm text-muted-foreground">
          Please retry. If the issue persists, refresh the page.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald px-4 text-sm font-semibold text-white hover:bg-emerald/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
