import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "@/components/layout/RootLayoutClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "INSTAT SDS",
    template: "%s | INSTAT SDS",
  },
  description: "Système de Digitalisation des Fiches Statistiques",
  applicationName: "INSTAT SDS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
