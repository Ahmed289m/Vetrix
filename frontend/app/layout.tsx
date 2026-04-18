import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vetrix — Smart Veterinary Platform",
    template: "%s | Vetrix",
  },
  description:
    "Next-generation veterinary clinic management platform — AI-assisted diagnostics, real-time case queues, fluid therapy calculators, and intelligent clinical workflows.",
  keywords: [
    "veterinary",
    "clinic management",
    "pet health",
    "veterinary software",
    "clinic dashboard",
    "Vetrix",
  ],
  authors: [{ name: "Vetrix Health Technologies" }],
  creator: "Vetrix Health Technologies",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Vetrix",
    title: "Vetrix — Smart Veterinary Platform",
    description:
      "Next-generation veterinary clinic management — AI-assisted, real-time, and built for speed.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Vetrix" }],
  },
  twitter: {
    card: "summary",
    title: "Vetrix — Smart Veterinary Platform",
    description: "Next-generation veterinary clinic management.",
    images: ["/logo.png"],
  },
  robots: { index: false, follow: false },
};

import { Providers } from "./Providers";
import { Toaster } from "@/app/_components/ui/toaster";
import { Toaster as Sonner } from "@/app/_components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
          <Sonner position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
