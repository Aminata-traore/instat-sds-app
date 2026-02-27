import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseServerClient } from "@/lib/supabase/server"

import FicheForm from "@/components/fiche/FicheForm"

export default async function NouvelleFichePage() {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-instat-blue mb-6">
        Créer une nouvelle fiche
      </h1>

      <FicheForm userId={session.user.id} />
    </div>
  )
}
