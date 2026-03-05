import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/app/_components/AppShell"
import Fiche1Form from "@/app/fiche1/_components/Fiche1Form"

export default async function NouvelleFiche1Page() {
  const supabase = supabaseServerClient(cookies())
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  return (
    <AppShell title="Nouvelle Fiche 1">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-extrabold text-instat-blue mb-6">
          FICHE 1 — Bilan des activités statistiques (N-1)
        </h2>

        <Fiche1Form userId={session.user.id} />
      </div>
    </AppShell>
  )
}
