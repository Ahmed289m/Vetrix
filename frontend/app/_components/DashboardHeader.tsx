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
    <header className="sticky top-0 z-20 border-b border-border/20 bg-background/70 backdrop-blur-xl">
      <div className="px-3 sm:px-5 lg:px-7 py-3 sm:py-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-linear-to-r from-emerald/8 via-transparent to-cyan/7 shadow-[0_16px_40px_-28px_rgba(16,185,129,0.65)] px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_22%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(6,182,212,0.15),transparent_34%)]" />
          <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <SidebarTrigger className="w-10 h-10 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center text-foreground hover:bg-muted/40 transition-colors" />
            </div>

            <div className="min-w-0 flex flex-col gap-1">
              <p className="truncate text-sm sm:text-base lg:text-lg font-black tracking-tight text-foreground">
                {displayName}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald">
                  {displayRole}
                </span>
                <span className="inline-flex min-w-0 items-center rounded-full border border-cyan/25 bg-cyan/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-cyan max-w-[45vw] sm:max-w-md">
                  <span className="truncate">{displayClinic}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleTheme}
                      className="w-10 h-10 rounded-xl bg-muted/35 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/8 hover:border-emerald/30 transition-colors duration-200"
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
                      className="w-10 h-10 rounded-xl bg-muted/35 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-emerald hover:bg-emerald/8 hover:border-emerald/30 transition-colors duration-200"
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
                <div className="absolute -inset-1 bg-linear-to-tr from-emerald to-cyan rounded-xl blur-sm opacity-40" />
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
