import React from "react";

export default function DashboardLoading() {
  return (
    <div className="route-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10" />
        <div className="flex-1">
          <div className="h-4 w-56 bg-white/5 border border-white/10 rounded-md animate-pulse" />
          <div className="mt-3 h-3 w-80 bg-white/5 border border-white/10 rounded-md animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
          />
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
        <div className="h-40" />
      </div>
    </div>
  );
}

