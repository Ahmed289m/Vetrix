"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, ShieldCheck } from "lucide-react";
import { ChatAssistant } from "@/app/_components/ChatAssistant";

export default function AiAssistantPage() {
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Decorative ambient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/3 w-[500px] h-[500px] bg-emerald/[0.05] rounded-full blur-[150px]" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] bg-cyan/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] bg-orange/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="shrink-0 relative z-10 px-4 sm:px-6 lg:px-8 pt-6 pb-3"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Icon with glow ring */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald/25 to-cyan/15 rounded-2xl blur-md" />
              <div className="relative w-11 h-11 rounded-2xl gradient-emerald-cyan flex items-center justify-center shadow-lg shadow-emerald/15">
                <Bot className="w-5.5 h-5.5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold tracking-tight gradient-text">
                  AI Clinical Assistant
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald/8 border border-emerald/15 text-[10px] font-bold text-emerald/80 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-medium">
                Differential diagnosis assistant
              </p>
            </div>
          </div>
          {/* Security badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/6 border border-emerald/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald/50" />
            <span className="text-[10px] font-bold text-emerald/50 uppercase tracking-wider">
              Doctor Only
            </span>
          </div>
        </div>
        {/* Subtle separator */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        </div>
      </motion.div>

      {/* Full-height chat */}
      <div className="flex-1 min-h-0 relative z-10">
        <ChatAssistant role="doctor" />
      </div>
    </div>
  );
}
