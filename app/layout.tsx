import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import RootLayoutClient from "@/components/layout/RootLayoutClient"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "INSTAT SDS",
  description: "Système de Digitalisation des Fiches Statistiques",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
