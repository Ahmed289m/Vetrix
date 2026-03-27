import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Moon, Sun,
  Stethoscope, Users, LayoutDashboard,
  Calendar, DollarSign, Package, FileText, LogOut, Sparkles,
  Search, Bell, Settings, Pill, PawPrint, ClipboardList, Hash, Receipt,
  ArrowLeft, Languages
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { ChatAssistant } from "./ChatAssistant";
import { useLang } from "@/hooks/useLanguage";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "doctor" | "staff";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mode, setMode] = useState<"dashboard" | "assistant">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const { lang, setLang, t } = useLang();

  const doctorNav = [
    { title: t("dashboard"), url: "/doctor", icon: LayoutDashboard },
    { title: t("appointments"), url: "/doctor/appointments", icon: Calendar },
    { title: t("patients"), url: "/doctor/patients", icon: PawPrint },
    { title: t("prescriptions"), url: "/doctor/prescriptions", icon: Pill },
    { title: t("calculators"), url: "/doctor/calculators", icon: Settings },
    { title: t("cases"), url: "/doctor/cases", icon: Hash },
    { title: t("ai_assistant"), url: "#ai", icon: Sparkles, isAI: true },
  ];

  const staffNav = [
    { title: t("dashboard"), url: "/staff", icon: LayoutDashboard },
    { title: t("owners_pets"), url: "/staff/owners", icon: Users },
    { title: t("bookings"), url: "/staff/bookings", icon: Calendar },
    { title: t("visits"), url: "/staff/visits", icon: ClipboardList },
    { title: t("inventory"), url: "/staff/inventory", icon: Package },
    { title: t("finances"), url: "/staff/finances", icon: DollarSign },
    { title: t("reports"), url: "/staff/reports", icon: FileText },
    { title: t("invoices"), url: "/staff/invoices", icon: Receipt },
    { title: t("cases"), url: "/staff/cases", icon: Hash },
    { title: t("ai_assistant"), url: "#ai", icon: Sparkles, isAI: true },
  ];

  const nav = role === "doctor" ? doctorNav : staffNav;
  const isActive = (url: string) => location.pathname === url;
  const isAssistant = mode === "assistant";

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleNavClick = (item: typeof nav[0]) => {
    if (item.isAI) {
      setMode("assistant");
    } else {
      setMode("dashboard");
      navigate(item.url);
    }
  };

  // Fullscreen AI Assistant
  if (isAssistant) {
    return (
      <motion.div
        key="ai-fullscreen"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="h-screen flex flex-col bg-background chat-gradient"
      >
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/30 bg-card/30 backdrop-blur-xl shrink-0 z-10">
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode("dashboard")}
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
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-muted transition-all group">
              {isDark ? <Sun className="w-4 h-4 text-muted-foreground group-hover:text-orange" /> : <Moon className="w-4 h-4 text-muted-foreground group-hover:text-cyan" />}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatAssistant role={role} />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        className={`
          ${sidebarOpen ? 'fixed left-0 top-0 bottom-0 z-50' : 'hidden lg:flex'}
          w-[260px] bg-sidebar flex-col shrink-0 overflow-hidden border-r border-sidebar-border
          ${lang === "ar" ? "rtl:border-r-0 rtl:border-l rtl:right-0 rtl:left-auto" : ""}
        `}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-emerald-cyan flex items-center justify-center glow-emerald">
              <PawPrint className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-sidebar-accent-foreground">VETRA</span>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium uppercase tracking-widest">{t("vet_clinic")}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl glass-card flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-emerald-cyan flex items-center justify-center">
            {role === "doctor" ? <Stethoscope className="w-4 h-4 text-primary-foreground" /> : <Users className="w-4 h-4 text-primary-foreground" />}
          </div>
          <div>
            <span className="text-xs font-bold text-sidebar-accent-foreground">
              {role === "doctor" ? "Dr. Emily Chen" : "Sarah Wilson"}
            </span>
            <p className="text-[10px] text-sidebar-foreground/50">
              {role === "doctor" ? t("veterinarian") : t("reception")}
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/25 mb-2 block">{t("navigation")}</span>
          {nav.map((item) => (
            <button
              key={item.title}
              onClick={() => handleNavClick(item)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                (item.isAI && isAssistant) || (!item.isAI && isActive(item.url) && !isAssistant)
                  ? "bg-emerald/10 text-emerald border border-emerald/20 shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                (item.isAI && isAssistant) || (!item.isAI && isActive(item.url) && !isAssistant)
                  ? "text-emerald" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
              }`} />
              {item.title}
              {item.isAI && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald/10 text-emerald">AI</span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="p-3 space-y-1 border-t border-sidebar-border/50">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all"
          >
            <Languages className="w-4 h-4 shrink-0" /> {lang === "en" ? "العربية" : "English"}
          </button>
          <button onClick={() => navigate(role === "doctor" ? "/staff" : "/doctor")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all">
            <Users className="w-4 h-4 shrink-0" /> {role === "doctor" ? t("switch_to_staff") : t("switch_to_doctor")}
          </button>
          <button onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all">
            <LogOut className="w-4 h-4 shrink-0" /> {t("sign_out")}
          </button>
        </div>
      </motion.nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/50 bg-card/50 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 max-w-md flex-1 ${
              searchFocused ? "bg-muted/60 border-emerald/30 shadow-sm" : "bg-muted/30 border-border/50"
            }`}>
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input placeholder={t("search")} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
              <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">⌘K</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-muted transition-all duration-200 group">
              {isDark ? <Sun className="w-4 h-4 text-muted-foreground group-hover:text-orange" /> : <Moon className="w-4 h-4 text-muted-foreground group-hover:text-cyan" />}
            </button>
            <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald animate-pulse" />
            </button>
            <button className="w-9 h-9 rounded-xl gradient-emerald-cyan flex items-center justify-center text-primary-foreground text-sm font-bold ml-1">
              {role === "doctor" ? "EC" : "SW"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <motion.div
            key="dash"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar gradient-mesh"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
