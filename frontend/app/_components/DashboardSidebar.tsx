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
  CalendarCheck,
  Users,
  Eye,
  Package,
  Receipt,
  TrendingUp,
  BookOpen,
  ChevronRight,
} from "lucide-react";

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
    href: "/dashboard/cases",
    labelKey: "cases",
    icon: Hash,
    roles: ["doctor", "staff"],
  },
  {
    href: "/dashboard/calculators",
    labelKey: "calculators",
    icon: Calculator,
    roles: ["doctor"],
  },
  {
    href: "/dashboard/prescriptions",
    labelKey: "prescriptions",
    icon: FileText,
    roles: ["doctor"],
  },
  {
    href: "/dashboard/bookings",
    labelKey: "bookings",
    icon: CalendarCheck,
    roles: ["staff"],
  },
  {
    href: "/dashboard/owners",
    labelKey: "owners_pets",
    icon: Users,
    roles: ["staff"],
  },
  {
    href: "/dashboard/visits",
    labelKey: "visits",
    icon: Eye,
    roles: ["staff"],
  },
  {
    href: "/dashboard/inventory",
    labelKey: "inventory",
    icon: Package,
    roles: ["staff"],
  },
  {
    href: "/dashboard/invoices",
    labelKey: "invoices",
    icon: Receipt,
    roles: ["staff"],
  },
  {
    href: "/dashboard/finances",
    labelKey: "finances",
    icon: TrendingUp,
    roles: ["staff"],
  },
  {
    href: "/dashboard/reports",
    labelKey: "reports",
    icon: BookOpen,
    roles: ["staff"],
  },
];

export function DashboardSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { t } = useLang();

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar
      variant="sidebar"
      collapsible="none"
      className="border-r border-border/5 bg-sidebar/60 backdrop-blur-xl"
    >
      {" "}
      <SidebarHeader className="p-6 border-b border-border/10">
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <div className="absolute -inset-1 from-emerald to-cyan rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <Image
              src="/logo.svg"
              alt="Vetrix logo"
              width={120}
              height={120}
              className="relative w-[120px] h-[120px] object-contain  transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-[0.18em] leading-none">
              {role} portal
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="custom-scrollbar px-2 py-4">
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
                      className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group overflow-hidden ${
                        isActive
                          ? "bg-emerald/10 text-emerald"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <Link href={item.href}>
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
      <SidebarFooter className="p-4 border-t border-border/10 bg-sidebar/30">
        <div className="group flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-emerald/20 transition-all duration-300 transition-transform duration-200 group-hover:scale-[1.02]">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald to-cyan rounded-lg blur-[2px] opacity-0 group-hover:opacity-40 transition duration-300" />
            <div className="relative w-9 h-9 rounded-lg gradient-emerald-cyan flex items-center justify-center text-xs font-black text-white uppercase shadow-md leading-none">
              {role[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black capitalize tracking-tight truncate group-hover:text-emerald transition-colors">
              Dr. {role}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">
                Online
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald transition-colors" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
