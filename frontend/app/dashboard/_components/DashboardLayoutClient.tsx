"use client";

import React, { memo, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/app/_components/ui/sidebar";
import { DashboardSidebar } from "@/app/_components/DashboardSidebar";
import { DashboardHeader } from "@/app/_components/DashboardHeader";
import { useRole } from "@/app/_components/RoleContext";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";

const MemoDashboardHeader = memo(DashboardHeader);
const MemoDashboardSidebar = memo(DashboardSidebar);

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showRouteLoading, setShowRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // Show a small spinner only if the route transition takes long enough
    // to be perceived as "slow" (avoid flicker on fast navigations).
    const resetTimer = window.setTimeout(() => setShowRouteLoading(false), 0);
    const startNavTimer = window.setTimeout(() => setIsNavigating(true), 0);
    const showTimer = window.setTimeout(() => setShowRouteLoading(true), 140);
    const hideTimer = window.setTimeout(() => setShowRouteLoading(false), 650);
    const fadeTimer = window.setTimeout(() => setIsNavigating(false), 260);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(startNavTimer);
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-3 border-emerald/25 border-t-emerald animate-spin" />
      </div>
    );
  }

  if (role === "client") {
    return (
      <div className="min-h-screen w-full bg-background text-foreground relative overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full bg-background text-foreground relative overflow-x-hidden">
        {/* 🔥 Background Mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />

        {/* Sidebar */}
        <MemoDashboardSidebar role={role} />

        {/* Content */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Header */}
          <MemoDashboardHeader role={role} />

          {/* Main */}
          <main className="flex-1 overflow-hidden relative">
            {showRouteLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-emerald/25 border-t-emerald animate-spin" />
              </div>
            )}

            <div
              className={`h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar pb-8 ${isNavigating ? "route-fade-in" : ""}`}
            >
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
