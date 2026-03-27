"use client";

import { motion } from "@/app/_components/fast-motion";
import { ArrowLeft, Languages, Moon, Sun } from "lucide-react";
import { ChatAssistant } from "@/app/_components/ChatAssistant";
import { useTheme } from "@/app/_hooks/useTheme";
import { useLang } from "@/app/_hooks/useLanguage";
import type { Role } from "@/app/_components/RoleContext";

interface AiAgencyPageProps {
  role: Role;
  onBackToNormal: () => void;
}

export function AiAgencyPage({ role, onBackToNormal }: AiAgencyPageProps) {
  const { isDark, toggle } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <motion.div
      key="ai-agency-mode"
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="h-screen flex flex-col bg-background chat-gradient"
    >
      <div className="h-14 flex items-center justify-between px-3 sm:px-6 border-b border-border/30 bg-card/30 backdrop-blur-xl shrink-0 z-10">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBackToNormal}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </motion.button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted/30 border border-border/50 hover:border-emerald/30 transition-all flex items-center gap-1.5"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === "en" ? "عربي" : "EN"}
          </button>
          <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-muted transition-all group">
            {isDark ? (
              <Sun className="w-4 h-4 text-muted-foreground group-hover:text-orange" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground group-hover:text-cyan" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant role={role} />
      </div>
    </motion.div>
  );
}

