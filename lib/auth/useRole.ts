"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type Role = "agent" | "validateur" | "admin"

export function useRole() {
  const supabase = createClient()
  const [role, setRole] = useState<Role>("agent")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      const user = u?.user
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!error && data?.role) setRole(data.role as Role)
      setLoading(false)
    })()
  }, [])

  return { role, loading }
}
