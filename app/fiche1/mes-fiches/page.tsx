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
    .from("fiche1")
    .select("id, numero_fiche, annee, statut, created_at")
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return <div className="p-6">Erreur: {error.message}</div>
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes fiches Fiche 1</h1>

      <div className="space-y-3">
        {fiches?.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between border rounded-lg p-4"
          >
            <div>
              <div className="font-semibold">
                {f.numero_fiche || f.id}
              </div>

              <div className="text-sm text-gray-500">
                Année: {f.annee} • Statut: {f.statut}
              </div>
            </div>

            <Link
              href={`/fiche1/${f.id}`}
              className="px-3 py-2 bg-black text-white rounded"
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
