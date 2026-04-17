"use client";

import { Sun, Moon, Languages } from "lucide-react";
import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { useTheme } from "@/app/_hooks/useTheme";
import { useAuth } from "@/app/_hooks/useAuth";

type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface DashboardHeaderProps {
  role: Role;
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const { isDark, toggle } = useTheme();
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const displayName = user?.fullname || user?.email?.split("@")[0] || t("user");
  const displayClinic = user?.clinicName || t("vet_clinic") || t("clinic");
  const displayRole =
    role === "doctor"
      ? t("doctor")
      : role === "staff"
        ? t("staff")
        : role === "owner"
          ? t("owner")
          : role === "client"
            ? t("client")
            : "Admin";

  const toggleTheme = () => {
    toggle();
  };

  const toggleLang = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/20 bg-background/65 backdrop-blur-xl">
      <div className="px-3 sm:px-5 lg:px-7 py-3 sm:py-4">
        <div className="rounded-2xl border border-border/25 bg-linear-to-r from-white/[0.035] via-white/2 to-transparent shadow-[0_8px_24px_-20px_rgba(16,185,129,0.45)] px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <SidebarTrigger className="w-10 h-10 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center text-foreground hover:bg-muted/40 transition-colors" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm sm:text-base font-black tracking-tight text-foreground">
                {displayName}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="font-bold uppercase tracking-wider">
                  {displayRole}
                </span>
                <span className="opacity-40">•</span>
                <span className="truncate max-w-[40vw] sm:max-w-[24rem]">
                  {displayClinic}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleTheme}
                      className="w-10 h-10 rounded-xl bg-muted/30 border border-border/25 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/25 transition-colors duration-200"
                    >
                      {isDark ? (
                        <Sun className="w-4.5 h-4.5" />
                      ) : (
                        <Moon className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
                    {t("toggle_theme")}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="w-10 h-10 rounded-xl bg-muted/30 border border-border/25 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/5 hover:border-emerald/25 transition-colors duration-200"
                      onClick={toggleLang}
                    >
                      <Languages className="w-4.5 h-4.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
                    {lang === "ar" ? t("switch_to_en") : t("switch_to_ar")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="relative shrink-0">
                <div className="absolute -inset-0.5 bg-linear-to-tr from-emerald to-cyan rounded-xl blur opacity-30" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-emerald-cyan flex items-center justify-center text-[11px] sm:text-xs font-black text-white uppercase shadow-md leading-none">
                  {(displayName[0] || "U").toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
