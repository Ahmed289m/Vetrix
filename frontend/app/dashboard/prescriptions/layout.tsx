import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Prescriptions",
  description: "Manage patient prescriptions, drug assignments, and prescription item details.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
