import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseServerClient } from "@/lib/supabase/server"
import Fiche1Form from "@/components/fiche1/Fiche1Form"

export default async function NouvelleFiche1Page() {
  const supabase = supabaseServerClient(cookies())
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-instat-blue mb-6">
        FICHE 1 — Bilan des activités statistiques (N-1)
      </h1>

      <Fiche1Form userId={session.user.id} />
    </div>
  )
}
