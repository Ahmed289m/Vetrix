import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Vetrix AI — differential diagnosis assistant for doctors.",
};

export default function AiAssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
