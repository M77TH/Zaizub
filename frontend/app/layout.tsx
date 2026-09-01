import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Zaizub — Auto-subtitle your videos and make them travel",
  description:
    "Zaizub turns raw footage into perfectly timed, on-brand captions in seconds. Thai and English, auto-synced, ready for TikTok, Reels, and Shorts.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&family=Athiti:wght@400;600;700&family=Bai+Jamjuree:wght@400;600;700&family=Chakra+Petch:wght@400;600;700&family=Charm:wght@400;700&family=Chonburi&family=Itim&family=Kanit:ital,wght@0,400;0,600;0,700;1,400&family=Krub:wght@400;600;700&family=Mali:wght@400;600;700&family=Mitr:wght@400;600&family=Noto+Sans+Thai:wght@400;600;700&family=Pattaya&family=Pridi:wght@400;600;700&family=Prompt:ital,wght@0,400;0,600;0,700;1,400&family=Sarabun:ital,wght@0,400;0,600;0,700;1,400&family=Trirong:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
