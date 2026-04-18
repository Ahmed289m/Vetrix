import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finances",
  description:
    "Track clinic revenue, expenses, and billing operations in the Vetrix finance dashboard.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
