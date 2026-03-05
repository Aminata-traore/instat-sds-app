"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type Role = "agent" | "validateur" | "admin"

export function useRole() {
  const supabase = useMemo(() => createClient(), [])

  const [role, setRole] = useState<Role>("agent")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
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
        .maybeSingle()

      if (!error && data?.role) {
        setRole(data.role as Role)
      }

      setLoading(false)
    }

    fetchRole()
  }, [supabase])

  return { role, loading }
}
