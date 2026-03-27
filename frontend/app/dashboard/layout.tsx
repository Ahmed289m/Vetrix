// app/dashboard/layout.tsx

import DashboardLayoutClient from "./_components/DashboardLayoutClient";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
