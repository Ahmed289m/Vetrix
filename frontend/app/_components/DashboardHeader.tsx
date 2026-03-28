"use client";

import { Sun, Moon, Languages } from "lucide-react";
import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { useTheme } from "@/app/_hooks/useTheme";
import { AgencyModeToggle, UiMode } from "@/app/_components/AgencyModeToggle";

type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface DashboardHeaderProps {
  role: Role;
  uiMode: UiMode;
  onUiModeChange: (mode: UiMode) => void;
}

export function DashboardHeader({ role, uiMode, onUiModeChange }: DashboardHeaderProps) {
  const { isDark, toggle } = useTheme();
  const { t, lang, setLang } = useLang();

  const toggleTheme = () => {
    toggle();
  };

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3 bg-background/40 backdrop-blur-md border-b border-border/10">
      {/* Mobile menu toggle */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        <SidebarTrigger className="w-10 h-10 rounded-xl bg-muted/20 border border-border/20 flex items-center justify-center text-foreground hover:bg-muted/30 transition-colors" />
      </div>


      <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
        <TooltipProvider>
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-colors duration-200 shadow-sm
                transform hover:scale-[1.05] active:scale-[0.95]"
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
              {t("toggle_theme")}
            </TooltipContent>
          </Tooltip>

          <AgencyModeToggle mode={uiMode} onChange={onUiModeChange} compact />

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-10 h-10 rounded-xl bg-muted/20 border border-border/10 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-colors duration-300 shadow-sm hidden sm:flex"
                onClick={toggleLang}
              >
                <Languages className="w-4.5 h-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
              {lang === "ar" ? "Switch to EN" : "التبديل إلى العربية"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-6 bg-border/20 mx-0.5 hidden md:block" />

        {/* User profile summary */}
        <div className="flex items-center gap-2 sm:gap-3 pl-0 sm:pl-1 cursor-pointer group transition-transform duration-200 hover:translate-x-[2px]">
          <div className="hidden md:block text-right">
            <p className="text-xs font-black capitalize leading-none group-hover:text-emerald transition-colors">
              {role === "doctor" ? "Dr. " : ""}{role}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold uppercase tracking-wider">
              {t(role === "doctor" ? "veterinarian" : "reception")}
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-emerald to-cyan rounded-xl blur opacity-0 group-hover:opacity-40 transition duration-300" />
            <div className="relative w-9 h-9 rounded-xl gradient-emerald-cyan flex items-center justify-center text-[11px] font-black text-white uppercase shadow-md leading-none transform group-hover:scale-105 transition-transform">
              {role[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
