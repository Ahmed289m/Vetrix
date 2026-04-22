"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";
import { ChatAssistant } from "@/app/_components/ChatAssistant";

export default function AiAssistantPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 px-4 sm:px-6 lg:px-8 pt-6 pb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-emerald-cyan flex items-center justify-center glow-pulse shrink-0">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight gradient-text">
                AI Clinical Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/10 border border-emerald/20 text-[10px] font-bold text-emerald uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Differential diagnosis assistant · Doctors only
            </p>
          </div>
        </div>
      </motion.div>

      {/* Full-height chat */}
      <div className="flex-1 min-h-0">
        <ChatAssistant role="doctor" />
      </div>
    </div>
  );
}
