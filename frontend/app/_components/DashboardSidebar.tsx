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
} from "@/app/_components/ui/sidebar";
import { useLang } from "@/app/_hooks/useLanguage";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Hash,
  Calculator,
  FileText,
  UserPlus,
  Store,
  Heart,
  Calendar,
  BarChart3,
  Wallet,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/app/_hooks/useAuth";

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
    roles: ["staff", "doctor", "owner", "client"],
  },
  {
    href: "/dashboard/cases",
    labelKey: "visits_cases",
    icon: Hash,
    roles: ["doctor", "staff", "owner"],
  },
  {
    href: "/dashboard/appointments",
    labelKey: "appointments",
    icon: Calendar,
    roles: ["staff", "owner", "client"],
  },
  {
    href: "/dashboard/prescriptions",
    labelKey: "prescriptions",
    icon: FileText,
    roles: ["doctor", "owner", "staff"],
  },
  {
    href: "/dashboard/calculators",
    labelKey: "medical_calculators",
    icon: Calculator,
    roles: ["doctor"],
  },
  {
    href: "/dashboard/reports",
    labelKey: "analytics_reports",
    icon: BarChart3,
    roles: ["owner"],
  },
  {
    href: "/dashboard/finances",
    labelKey: "financial_overview",
    icon: Wallet,
    roles: ["owner"],
  },
];

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { t } = useLang();
  const { logout, isLoggingOut } = useAuth();

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/10 bg-sidebar/60 backdrop-blur-xl"
    >
      {" "}
      <SidebarHeader className="pt-8 pb-2 border-b border-border/10">
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute -inset-1 from-emerald to-cyan rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <Image
              src="/logo.svg"
              alt="Vetrix logo"
              width={110}
              height={110}
              className="relative w-27.5 h-27.5 object-contain transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.18em] leading-none">
              {role === "doctor" ? "Medical Portal" : "Management Portal"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar px-2 py-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-4 mb-4">
            {t("navigation")}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {filtered.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <SidebarMenuItem key={item.href}>
                  <div>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`relative flex items-center gap-3.5 px-4 py-2.5 rounded-sm text-sm font-semibold transition-colors duration-200 group overflow-hidden ${
                        isActive
                          ? "bg-emerald/10 text-emerald"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Link href={item.href} prefetch={true}>
                        {isActive && (
                          <div className="absolute left-0 top-1/4 bottom-1/4 w-1 gradient-emerald-cyan rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        )}
                        <div
                          className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-emerald" : "group-hover:text-emerald"}`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                        </div>
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-emerald/50 transition-transform duration-200 group-hover:translate-x-0" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/10">
        <div className="group flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/20 border border-border/10 hover:border-emerald/20 transition-all duration-300 transform group-hover:scale-[1.02]">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-linear-to-br from-emerald to-cyan rounded-lg blur-[2px] opacity-0 group-hover:opacity-40 transition duration-300" />
            <div className="relative w-9 h-9 rounded-lg gradient-emerald-cyan flex items-center justify-center text-xs font-black text-white uppercase shadow-md leading-none">
              {role[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black capitalize tracking-tight truncate group-hover:text-emerald transition-colors">
              {role === "doctor" ? "Dr. " : ""}
              {role}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">
                Online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-red-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? "Signing out" : "Sign out"}</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
