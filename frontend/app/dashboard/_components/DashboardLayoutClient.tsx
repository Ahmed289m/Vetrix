"use client";

import React, { memo, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/app/_components/ui/sidebar";
import { DashboardSidebar } from "@/app/_components/DashboardSidebar";
import { DashboardHeader } from "@/app/_components/DashboardHeader";
import { useRole } from "@/app/_components/RoleContext";
import { usePathname } from "next/navigation";

const MemoDashboardHeader = memo(DashboardHeader);
const MemoDashboardSidebar = memo(DashboardSidebar);

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useRole();
  const pathname = usePathname();
  const [showRouteLoading, setShowRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Show a small spinner only if the route transition takes long enough
    // to be perceived as "slow" (avoid flicker on fast navigations).
    setShowRouteLoading(false);
    setIsNavigating(true);
    const showTimer = window.setTimeout(() => setShowRouteLoading(true), 140);
    const hideTimer = window.setTimeout(() => setShowRouteLoading(false), 650);
    const fadeTimer = window.setTimeout(() => setIsNavigating(false), 260);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [pathname]);

  return (
    <SidebarProvider>
      {/* `overflow-hidden` can clip the sidebar off-canvas slide animation. */}
      <div className="flex min-h-screen w-full bg-background text-foreground relative overflow-y-hidden">
        {/* 🔥 Background Mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />

        {/* Sidebar */}
        <MemoDashboardSidebar role={role} />

        {/* Content */}
        <SidebarInset className="flex flex-col flex-1 relative z-10 min-w-0">
          {/* Header */}
          <MemoDashboardHeader role={role} />

          {/* Main */}
          <main className="flex-1 w-full relative">
            {showRouteLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-emerald/25 border-t-emerald animate-spin" />
              </div>
            )}

            <div className={`h-full ${isNavigating ? "route-fade-in" : ""}`}>
              <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
