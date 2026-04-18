import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Users & Staff",
  description: "Manage clinic staff, roles, permissions, and user accounts.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
