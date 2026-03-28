"use client";

import { Bot, Sparkles } from "lucide-react";

export type UiMode = "normal" | "agency";

interface AgencyModeToggleProps {
  mode: UiMode;
  onChange: (mode: UiMode) => void;
  compact?: boolean;
}

export function AgencyModeToggle({ mode, onChange, compact = false }: AgencyModeToggleProps) {
  const base = compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-1.5 text-[11px]";

  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onChange("agency")}
        className={`relative inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider transition-colors ${base} ${
          mode === "agency"
            ? "gradient-emerald-cyan text-primary-foreground shadow-[0_0_16px_hsl(var(--emerald)/0.35)]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Bot className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">AI Agency</span>
        <span className="sm:hidden">AI</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("normal")}
        className={`relative inline-flex items-center gap-1.5 rounded-full font-black uppercase tracking-wider transition-colors ${base} ${
          mode === "normal"
            ? "bg-white/10 text-foreground border border-white/10"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Normal</span>
      </button>
    </div>
  );
}

