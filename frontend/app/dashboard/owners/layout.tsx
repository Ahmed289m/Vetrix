import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Owners",
  description: "View and manage pet owners, contact information, and linked patient records.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
