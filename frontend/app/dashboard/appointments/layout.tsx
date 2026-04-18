import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Appointments",
  description: "Manage clinic appointments, schedules, and booking statuses for all patients.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
