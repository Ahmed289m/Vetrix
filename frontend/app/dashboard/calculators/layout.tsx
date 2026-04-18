import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Medical Calculators",
  description: "Clinical calculators — fluid therapy with allometric maintenance, deficit, ongoing losses, infusion rates and dilution formulas.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
