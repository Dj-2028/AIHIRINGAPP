import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillVelocity — Editorial Talent Data",
  description:
    "Dense, data-driven hiring platform that evaluates candidates by velocity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#FAFAF9]`}>
      <body className="min-h-full font-sans text-[#1A1A18] selection:bg-[#E5E5E3]">{children}</body>
    </html>
  );
}
