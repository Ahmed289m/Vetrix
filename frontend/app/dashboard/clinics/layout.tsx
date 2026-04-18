import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Clinic Management",
  description: "Superadmin clinic management — create, configure, and manage clinic accounts.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
