"use client";

import { motion } from "framer-motion";
import { Bot, ShieldCheck, Activity, Sparkles } from "lucide-react";
import { ChatAssistant } from "@/app/_components/ChatAssistant";

export default function AiAssistantPage() {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Decorative ambient mesh — layered, animated */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-[20%] w-[550px] h-[550px] bg-emerald/[0.05] rounded-full blur-[160px] animate-float" />
        <div className="absolute -bottom-32 right-[15%] w-[450px] h-[450px] bg-cyan/[0.04] rounded-full blur-[130px]" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[45%] -left-24 w-[350px] h-[350px] bg-orange/[0.02] rounded-full blur-[110px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
        className="shrink-0 relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-3"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon with animated glow ring */}
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl border border-emerald/10 animate-[spin_25s_linear_infinite]" />
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald/25 to-cyan/15 rounded-2xl blur-md" />
              <div className="relative w-12 h-12 rounded-2xl gradient-emerald-cyan flex items-center justify-center shadow-xl shadow-emerald/15 border border-white/10">
                <Bot className="w-6 h-6 text-primary-foreground drop-shadow-sm" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald/20 border border-emerald/30 flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-2 h-2 text-emerald" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight gradient-text">
                  AI Clinical Assistant
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tint/[0.04] border border-tint/[0.08] text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  Vetrix AI
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5 font-medium">
                Differential diagnosis · Clinical intelligence
              </p>
            </div>
          </div>

          {/* Security badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-tint/[0.03] border border-tint/[0.06]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald/40" />
            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
              Doctor Only
            </span>
          </div>
        </div>

        {/* Gradient separator */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald/15 to-transparent" />
        </div>
      </motion.div>

      {/* Full-height chat */}
      <div className="flex-1 min-h-0 relative z-10">
        <ChatAssistant role="doctor" />
      </div>
    </div>
  );
}
