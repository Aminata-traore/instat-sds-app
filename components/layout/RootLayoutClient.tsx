"use client"

import Footer from "./Footer"

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-instat-gray">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
