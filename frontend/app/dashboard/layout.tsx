// app/dashboard/layout.tsx
import type { Metadata } from "next";
import DashboardLayoutClient from "./_components/DashboardLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Dashboard | Vetrix",
    template: "%s | Vetrix",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
