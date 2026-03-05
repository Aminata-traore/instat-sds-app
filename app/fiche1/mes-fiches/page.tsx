import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseServerClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function MesFichesPage() {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: fiches, error } = await supabase
    .from("answers_fiche1")
    .select("id, titre, numero_fiche, annee, statut, statut_validation, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return <div className="p-6">Erreur : {error.message}</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes fiches Fiche 1</h1>

      <div className="space-y-3">
        {fiches?.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between border rounded-lg p-4 bg-white"
          >
            <div>
              <div className="font-semibold">
                {f.titre || f.numero_fiche || f.id}
              </div>

              <div className="text-sm text-gray-500">
                Année : {f.annee ?? "-"} • Statut : {f.statut}
              </div>

              {f.statut_validation && (
                <div className="text-xs text-gray-400">
                  Validation : {f.statut_validation}
                </div>
              )}
            </div>

            <Link
              href={`/fiches/${f.id}`}
              className="px-3 py-2 bg-instat-blue text-white rounded-lg text-sm"
            >
              Ouvrir
            </Link>
          </div>
        ))}

        {fiches?.length === 0 && (
          <div className="text-sm text-gray-500">
            Aucune fiche pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
