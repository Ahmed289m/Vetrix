"use client";

import React, { memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { SidebarProvider, SidebarInset } from "@/app/_components/ui/sidebar";
import { DashboardSidebar } from "@/app/_components/DashboardSidebar";
import { DashboardHeader } from "@/app/_components/DashboardHeader";
import { useRole } from "@/app/_components/RoleContext";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "@/app/_components/fast-motion";
import type { UiMode } from "@/app/_components/AgencyModeToggle";
import { useAuth } from "@/app/_hooks/useAuth";

const AiAgencyPage = dynamic(
  () => import("@/app/_components/AiAgencyPage").then((m) => m.AiAgencyPage),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-3 border-emerald/25 border-t-emerald animate-spin" />
      </div>
    ),
  },
);

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
  const [uiMode, setUiMode] = useState<UiMode>(() => {
    if (typeof window === "undefined") return "normal";
    const stored = localStorage.getItem("vetrix_ui_mode");
    return stored === "agency" || stored === "normal" ? stored : "normal";
  });
  const [showRouteLoading, setShowRouteLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleUiModeChange = (mode: UiMode) => {
    setUiMode(mode);
    localStorage.setItem("vetrix_ui_mode", mode);
  };

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
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-3 border-emerald/25 border-t-emerald animate-spin" />
      </div>
    );
  }

  if (uiMode === "agency") {
    return (
      <AnimatePresence>
        <AiAgencyPage
          role={role}
          onBackToNormal={() => handleUiModeChange("normal")}
        />
      </AnimatePresence>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full bg-background text-foreground relative overflow-hidden">
        {/* 🔥 Background Mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />

        {/* Sidebar */}
        <MemoDashboardSidebar role={role} />

        {/* Content */}
        <SidebarInset className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Header */}
          <MemoDashboardHeader
            role={role}
            uiMode={uiMode}
            onUiModeChange={handleUiModeChange}
          />

          {/* Main */}
          <main className="flex-1 overflow-hidden relative">
            {showRouteLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-[2px] pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-emerald/25 border-t-emerald animate-spin" />
              </div>
            )}

            <div
              className={`h-full overflow-y-auto custom-scrollbar ${isNavigating ? "route-fade-in" : ""}`}
            >
              <div className="p-3 sm:p-5 lg:p-7 max-w-[1400px] mx-auto w-full">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
