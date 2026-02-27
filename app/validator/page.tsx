import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseServerClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

import ValidatorFicheList from "@/components/validator/ValidatorFicheList"

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

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-instat-blue mb-2">
        Validation des fiches
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Fiches soumises en attente de décision (validateur / admin).
      </p>

      <ValidatorFicheList />
    </div>
  )
}
