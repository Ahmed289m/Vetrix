import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Patient Records",
  description: "View and manage patient profiles, species, weight, and owner assignments.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
