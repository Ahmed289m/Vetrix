"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sun, Moon, Languages, Bell, Sparkles, Clock } from "lucide-react";
import { SidebarTrigger } from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { useTheme } from "@/app/_hooks/useTheme";
import { useAuth } from "@/app/_hooks/useAuth";
import { useNotifications } from "@/app/_components/WebSocketProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/app/_hooks/use-mobile";

type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface DashboardHeaderProps {
  role: Role;
}

/* ──────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────── */

function getGreeting(lang: "en" | "ar"): string {
  const h = new Date().getHours();
  if (lang === "ar") {
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء الخير";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingIcon(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 20) return "evening";
  return "night";
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 6) return "🌙";
  if (h < 12) return "☀️";
  if (h < 17) return "🌤️";
  if (h < 20) return "🌅";
  return "🌙";
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ──────────────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────────── */

export function DashboardHeader({ role }: DashboardHeaderProps) {
  const { isDark, toggle } = useTheme();
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const isMobile = useIsMobile();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const now = useLiveClock();

  const displayName = user?.fullname || user?.email?.split("@")[0] || t("user");
  const displayClinic = user?.clinicName || t("vet_clinic") || t("clinic");
  const greeting = useMemo(() => getGreeting(lang), [lang, now]);
  const emoji = useMemo(() => getGreetingEmoji(), [now]);
  const timeOfDay = useMemo(() => getGreetingIcon(), [now]);

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

  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (displayName[0] || "U").toUpperCase();
  }, [displayName]);

  const toggleTheme = useCallback(() => toggle(), [toggle]);
  const toggleLang = useCallback(
    () => setLang(lang === "ar" ? "en" : "ar"),
    [lang, setLang],
  );

  const handleNotificationsOpenChange = useCallback(
    (open: boolean) => {
      setIsNotificationsOpen(open);
      if (open) {
        markAllAsRead();
      }
    },
    [markAllAsRead],
  );

  const timeStr = now.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = now.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Time-of-day accent colors
  const accentGradient =
    timeOfDay === "morning"
      ? "from-amber-400/60 via-orange-300/40 to-yellow-200/30"
      : timeOfDay === "afternoon"
        ? "from-emerald/60 via-teal-400/40 to-cyan/30"
        : timeOfDay === "evening"
          ? "from-orange-500/50 via-rose-400/30 to-purple-400/20"
          : "from-indigo-500/50 via-blue-400/30 to-purple-500/20";

  const accentOrb1 =
    timeOfDay === "morning"
      ? "bg-amber-400/[0.12]"
      : timeOfDay === "afternoon"
        ? "bg-emerald/[0.08]"
        : timeOfDay === "evening"
          ? "bg-orange-400/[0.10]"
          : "bg-indigo-400/[0.08]";

  const accentOrb2 =
    timeOfDay === "morning"
      ? "bg-yellow-300/[0.08]"
      : timeOfDay === "afternoon"
        ? "bg-cyan/[0.06]"
        : timeOfDay === "evening"
          ? "bg-rose-400/[0.07]"
          : "bg-purple-400/[0.06]";

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <header className="sticky top-0 z-20 border-b border-border/15 bg-background/60 backdrop-blur-2xl">
      {/* Decorative top accent line — dynamic based on time of day */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGradient}`}
      />

      <div className="px-3 sm:px-5 lg:px-7 py-2.5 sm:py-3">
        <div className="relative overflow-hidden rounded-2xl border border-tint/[0.08] bg-gradient-to-br from-emerald/[0.05] via-background/80 to-cyan/[0.04] shadow-[0_8px_32px_-12px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Animated background orbs — colors shift with time of day */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className={`absolute -top-8 -left-8 w-32 h-32 ${accentOrb1} rounded-full blur-3xl animate-pulse`}
            />
            <div
              className={`absolute -bottom-8 -right-8 w-24 h-24 ${accentOrb2} rounded-full blur-3xl animate-pulse`}
              style={{ animationDelay: "1.5s" }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-emerald/[0.03] rounded-full blur-3xl" />
          </div>

          <div className="relative px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* ── Left: Sidebar Trigger (mobile/tablet) ── */}
              <div className="lg:hidden shrink-0">
                <SidebarTrigger className="w-10 h-10 rounded-xl bg-tint/[0.06] border border-tint/[0.08] flex items-center justify-center text-foreground hover:bg-emerald/[0.08] hover:border-emerald/20 hover:text-emerald transition-all duration-300 active:scale-95" />
              </div>

              {/* ── Left: Greeting + User Info ── */}
              <div className="min-w-0 flex-1">
                {/* Greeting row */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <motion.span
                    key={emoji}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="text-sm sm:text-base leading-none"
                  >
                    {emoji}
                  </motion.span>
                  <p className="text-xs sm:text-sm text-muted-foreground/70 font-medium truncate">
                    {greeting},{" "}
                    <span className="font-bold text-foreground">
                      {displayName}
                    </span>
                  </p>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Role badge */}
                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald/25 bg-emerald/[0.08] px-2 py-[3px] text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald shadow-[0_0_12px_rgba(16,185,129,0.08)]">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70" />
                    {displayRole}
                  </span>

                  {/* Clinic badge */}
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-cyan/20 bg-cyan/[0.06] px-2 py-[3px] text-[10px] sm:text-xs font-semibold text-cyan max-w-[35vw] sm:max-w-xs lg:max-w-sm">
                    <span className="truncate">{displayClinic}</span>
                  </span>

                  {/* Date/Time badge — hidden on very small screens */}
                  {!isMobile && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border/20 bg-tint/[0.04] px-2 py-[3px] text-[10px] sm:text-xs font-medium text-muted-foreground/60"
                    >
                      <Clock className="w-3 h-3 opacity-50" />
                      <span className="tabular-nums">{timeStr}</span>
                      <span className="w-px h-3 bg-border/30" />
                      <span>{dateStr}</span>
                    </motion.span>
                  )}
                </div>
              </div>

              {/* ── Right: Action buttons ── */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <TooltipProvider delayDuration={300}>
                  {/* Notifications */}
                  <Popover
                    open={isNotificationsOpen}
                    onOpenChange={handleNotificationsOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <button
                        aria-label={t("notifications")}
                        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-tint/[0.05] border border-tint/[0.08] flex items-center justify-center text-muted-foreground/60 hover:text-emerald hover:bg-emerald/[0.06] hover:border-emerald/20 transition-all duration-300 active:scale-95"
                      >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald shadow-[0_0_6px_rgba(16,185,129,0.55)]" />
                        )}
                      </button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="end"
                      sideOffset={8}
                      className="w-[300px] sm:w-[340px] p-0 border-border/20 bg-popover/95 backdrop-blur-xl shadow-2xl"
                    >
                      <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {t("notifications")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {lang === "ar"
                              ? "تحديثات فورية"
                              : "Realtime updates"}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald/10 text-emerald border border-emerald/20">
                          {unreadCount}
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm font-semibold text-foreground/80">
                              {lang === "ar"
                                ? "لا توجد تنبيهات بعد"
                                : "No notifications yet"}
                            </p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-border/15">
                            {notifications.map((item) => (
                              <li
                                key={item.id}
                                className="px-4 py-3 flex items-start gap-2.5"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-foreground leading-snug break-words">
                                    {item.message}
                                  </p>
                                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                                    {new Date(
                                      item.createdAt,
                                    ).toLocaleTimeString(
                                      lang === "ar" ? "ar-EG" : "en-US",
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Theme toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={toggleTheme}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-tint/[0.05] border border-tint/[0.08] flex items-center justify-center text-muted-foreground/60 hover:text-amber hover:bg-amber/[0.06] hover:border-amber/20 transition-all duration-300 active:scale-95"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={isDark ? "sun" : "moon"}
                            initial={{ scale: 0, rotate: -90, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0, rotate: 90, opacity: 0 }}
                            transition={{
                              duration: 0.2,
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            {isDark ? (
                              <Sun className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
                      {t("toggle_theme")}
                    </TooltipContent>
                  </Tooltip>

                  {/* Language toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-tint/[0.05] border border-tint/[0.08] flex items-center justify-center text-muted-foreground/60 hover:text-cyan hover:bg-cyan/[0.06] hover:border-cyan/20 transition-all duration-300 active:scale-95"
                        onClick={toggleLang}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={lang}
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center justify-center"
                          >
                            <Languages className="w-4 h-4" />
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border-border/10 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl">
                      {lang === "ar" ? t("switch_to_en") : t("switch_to_ar")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Divider */}
                <div className="hidden sm:block w-px h-7 bg-gradient-to-b from-transparent via-border/30 to-transparent mx-0.5" />

                {/* User avatar */}
                <div className="relative group/avatar shrink-0 cursor-pointer">
                  {/* Glow ring */}
                  <div className="absolute -inset-[3px] bg-gradient-to-tr from-emerald via-cyan to-emerald rounded-xl blur-[3px] opacity-0 group-hover/avatar:opacity-50 transition-opacity duration-500" />

                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-emerald-cyan flex items-center justify-center text-[11px] sm:text-xs font-black text-white uppercase shadow-lg leading-none ring-2 ring-white/[0.08] group-hover/avatar:ring-emerald/30 transition-all duration-300 group-hover/avatar:scale-105">
                    {initials}
                  </div>

                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald border-2 border-background shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
