import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Reports & Analytics",
  description: "Clinic performance reports — patient trends, revenue insights, and operational analytics.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
