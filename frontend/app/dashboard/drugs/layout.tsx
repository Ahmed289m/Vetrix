import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Drug Formulary",
  description: "Manage the clinic drug database — dosages, toxicity, interactions, and contraindications.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
