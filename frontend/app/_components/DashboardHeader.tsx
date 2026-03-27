"use client";

import { Bell, Search, Sun, Moon, Languages } from "lucide-react";
import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { useTheme } from "@/app/_hooks/useTheme";

type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface DashboardHeaderProps {
  role: Role;
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const { isDark, toggle } = useTheme();
  const { t, lang, setLang } = useLang();

  const toggleTheme = () => {
    toggle();
  };

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center gap-4 bg-background/20 backdrop-blur-md border-b border-border/5">
      {/* Mobile menu toggle */}
      <div className="flex items-center gap-4 lg:hidden">
        <SidebarTrigger className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:bg-white/10 transition-colors" />
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-xl group">
        <div className="relative flex items-center">
          <div className="absolute left-4 z-10">
            <Search className="w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-emerald transition-colors" />
          </div>
          <input
            type="text"
            placeholder={t("search_anything")}
            className="w-full h-11 pl-11 pr-4 rounded-2xl bg-white/5 border border-white/5 focus:border-emerald/30 focus:bg-white/[0.07] outline-none text-sm transition-all duration-300 placeholder:text-muted-foreground/40"
          />
          <div className="absolute right-3 hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
            <span className="text-[10px] font-black text-muted-foreground/60">⌘ K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <TooltipProvider>
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-all duration-200 shadow-sm
                transform hover:scale-[1.05] active:scale-[0.95]"
              >
                {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
              {t("toggle_theme")}
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-all duration-300 shadow-sm"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-coral shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
              {t("notifications")}
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/20 transition-all duration-300 shadow-sm hidden sm:flex"
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

        <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

        {/* User profile summary */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer group transition-transform duration-200 hover:translate-x-[2px]">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black capitalize leading-none group-hover:text-emerald transition-colors">Dr. {role}</p>
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
