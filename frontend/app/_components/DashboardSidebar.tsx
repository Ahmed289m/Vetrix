"use client";

import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calculator,
  UserPlus,
  Store,
  Heart,
  Calendar,
  ChevronRight,
  LogOut,
  Pill,
  Stethoscope,
  Bot,
} from "lucide-react";
import { useAuth } from "@/app/_hooks/useAuth";
import { motion } from "framer-motion";

type Role = "doctor" | "staff" | "admin" | "owner" | "client";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "dashboard",
    icon: LayoutDashboard,
    roles: ["doctor", "staff", "admin", "owner", "client"],
  },
  {
    href: "/dashboard/users",
    labelKey: "users_management",
    icon: UserPlus,
    roles: ["admin", "owner"],
  },
  {
    href: "/dashboard/clinics",
    labelKey: "clinics",
    icon: Store,
    roles: ["admin", "owner"],
  },
  {
    href: "/dashboard/owners",
    labelKey: "clients",
    icon: UserPlus,
    roles: ["staff", "owner", "admin"],
  },
  {
    href: "/dashboard/pets",
    labelKey: "patients",
    icon: Heart,
    roles: ["staff", "owner", "client"],
  },
  {
    href: "/dashboard/visits",
    labelKey: "visits",
    icon: Stethoscope,
    roles: ["doctor", "staff", "owner", "client", "admin"],
  },
  {
    href: "/dashboard/appointments",
    labelKey: "appointments",
    icon: Calendar,
    roles: ["staff", "client"],
  },
  {
    href: "/dashboard/calculators",
    labelKey: "medical_calculators",
    icon: Calculator,
    roles: ["doctor"],
  },
  {
    href: "/dashboard/ai-assistant",
    labelKey: "ai_assistant",
    icon: Bot,
    roles: ["doctor"],
  },
  {
    href: "/dashboard/drugs",
    labelKey: "drugs",
    icon: Pill,
    roles: ["doctor", "owner", "admin"],
  },
];

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { t } = useLang();
  const { logout, isLoggingOut } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/5 bg-sidebar/80 backdrop-blur-3xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]"
    >
      <SidebarHeader className="relative pt-8 pb-4 z-10 border-b border-tint/[0.04] bg-gradient-to-b from-emerald/5 to-transparent">
        {/* Subtle top decoration */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald/30 to-transparent" />

        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative group/sidebar-logo"
          >
            <div className="absolute -inset-1 from-emerald to-cyan rounded-2xl blur-lg opacity-20 group-hover/sidebar-logo:opacity-50 transition duration-500" />
            <div className="relative p-2 rounded-2xl bg-tint/[0.02] border border-tint/[0.05] shadow-inner backdrop-blur-md">
              <Image
                src="/logo.svg"
                alt="Vetrix logo"
                width={96}
                height={96}
                sizes="(min-width: 640px) 96px, 80px"
                unoptimized
                draggable={false}
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain transform group-hover/sidebar-logo:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex flex-col items-center gap-1 mt-4"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald/[0.08] border border-emerald/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span>
              </span>
              <p className="text-[10px] font-black text-emerald uppercase tracking-[0.2em] leading-none">
                {role === "doctor"
                  ? t("medical_portal")
                  : t("management_portal")}
              </p>
            </div>
          </motion.div>
        </div>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar px-3 py-4 relative z-0">
        {/* Subtle background glow behind nav items */}
        <div className="absolute top-1/4 -left-1/4 w-full h-1/2 bg-emerald/5 rounded-full blur-[80px] pointer-events-none" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-3 mb-4">
            {t("navigation")}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {filtered.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 group/nav-item overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-emerald/10 to-transparent text-emerald border-l-[3px] border-emerald shadow-[inset_1px_0_0_rgba(16,185,129,0.2)]"
                        : "text-muted-foreground/70 hover:bg-tint/[0.04] hover:text-foreground border-l-[3px] border-transparent"
                    }`}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={handleNavClick}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBackground"
                          className="absolute inset-0 bg-gradient-to-r from-emerald/10 to-cyan/5 -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <div
                        className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-emerald/[0.15] text-emerald shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            : "bg-tint/[0.03] group-hover/nav-item:bg-tint/[0.08] group-hover/nav-item:text-foreground group-hover/nav-item:scale-110"
                        }`}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                      </div>

                      <span className="flex-1 tracking-wide">
                        {t(item.labelKey)}
                      </span>

                      {isActive && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald/20 text-emerald">
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-tint/[0.04] bg-background/20 backdrop-blur-xl relative z-10">
        <div className="group/sidebar-user relative flex items-center gap-3 px-3 py-3 rounded-2xl bg-tint/[0.03] border border-tint/[0.06] hover:bg-tint/[0.05] hover:border-emerald/30 transition-all duration-300 overflow-hidden">
          {/* Subtle animated border gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald/0 via-emerald/10 to-cyan/0 translate-x-[-100%] group-hover/sidebar-user:translate-x-[100%] transition-transform duration-1000 ease-in-out" />

          <div className="relative shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald to-cyan rounded-xl blur-[4px] opacity-0 group-hover/sidebar-user:opacity-60 transition duration-500" />
            <div className="relative w-10 h-10 rounded-xl gradient-emerald-cyan flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-emerald/20 ring-2 ring-white/[0.05] group-hover/sidebar-user:ring-emerald/40 transition-all duration-300">
              {role[0]}
            </div>
            {/* Connection dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="flex-1 min-w-0 z-10">
            <p className="text-[13px] font-bold capitalize tracking-tight text-foreground truncate group-hover/sidebar-user:text-emerald transition-colors duration-300">
              {role === "doctor" ? "Dr. " : ""}
              {role}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-[0.1em] truncate">
              {role === "doctor" ? "Veterinarian" : "System Access"}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="relative z-10 shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all duration-300"
            aria-label="Sign out"
            title={t("sign_out")}
          >
            <LogOut
              className={`w-4 h-4 ${isLoggingOut ? "animate-pulse" : ""}`}
            />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
