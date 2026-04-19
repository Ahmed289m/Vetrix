// app/dashboard/layout.tsx
import type { Metadata } from "next";
import DashboardLayoutClient from "./_components/DashboardLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Vetrix",
  },
  description:
    "Vetrix clinical workspace for appointments, visits, prescriptions, patients, and operations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
