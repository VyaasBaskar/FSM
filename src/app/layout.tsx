import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";
import NProgressProvider from "./NProgressProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FunkyStats",
  description: "A high accuracy scoring estimation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div
          id="preload-bar"
          className="fixed top-0 left-0 w-full h-1 bg-blue-500 z-[9999] animate-pulse"
        />
        <ThemeToggle />
        <NProgressProvider />
        {children}
      </body>
    </html>
  );
}
