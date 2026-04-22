import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Vetrix AI — clinical intelligence for differential diagnoses.",
};

export default function AiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
