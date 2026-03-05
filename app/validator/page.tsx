import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseServerClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

export default async function ValidatorPage() {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  const role = (profile?.role ?? "agent") as Role

  if (role !== "validateur" && role !== "admin") {
    redirect("/dashboard")
  }

  // ✅ On centralise toute la validation sur une seule page
  redirect("/admin/fiche1")
}
