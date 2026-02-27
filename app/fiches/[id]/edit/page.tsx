import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseServerClient } from "@/lib/supabase/server"
import FicheForm from "@/components/fiche/FicheForm"

export default async function EditFichePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: fiche, error } = await supabase
    .from("answers_fiche1")
    .select("id,user_id,titre,annee,numero_fiche,statut,data")
    .eq("id", params.id)
    .maybeSingle()

  if (error || !fiche) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Fiche introuvable</div>
  }

  // Seul le propriétaire + brouillon peut éditer
  if (fiche.user_id !== session.user.id || fiche.statut !== "brouillon") {
    redirect("/fiches")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-instat-blue mb-6">
        Modifier la fiche
      </h1>

      <FicheForm userId={session.user.id} initialData={fiche} ficheId={fiche.id} />
    </div>
  )
}
