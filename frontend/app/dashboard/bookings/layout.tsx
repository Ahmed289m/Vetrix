import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Bookings",
  description: "Online booking management — approve, reschedule, or cancel client appointment requests.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
