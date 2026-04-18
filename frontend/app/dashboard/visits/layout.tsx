import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Visit Records",
  description: "Browse clinical visit history — notes, prescriptions, and treatment timelines.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
