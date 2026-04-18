import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Vetrix clinic account to access the dashboard.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
