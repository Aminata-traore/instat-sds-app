"use client"

import { useEffect, useMemo, useState } from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { supabaseClient } from "@/lib/supabase/client"

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => supabaseClient(), [])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    let alive = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      setIsAuthenticated(!!data.session)
    }

    init()

    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      alive = false
      auth.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <div className="flex min-h-screen flex-col bg-instat-gray">
      {isAuthenticated && <Navbar />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
