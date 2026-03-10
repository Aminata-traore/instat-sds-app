export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import Link from "next/link"
import { supabaseServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/app/_components/AppShell"
import { StatusBadge } from "@/components/StatusBadge"

export default async function FichesPage() {

  const supabase = supabaseServerClient(cookies())

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const { data: fiches } = await supabase
    .from("fiche1")
    .select("*")
    .eq("created_by", session?.user.id)
    .order("created_at", { ascending: false })

  return (

    <AppShell title="Mes fiches">

      <div className="space-y-4">

        {fiches?.map(f => (

          <div
            key={f.id}
            className="border rounded-xl p-4 flex justify-between bg-white"
          >

            <div>

              <div className="font-semibold">
                Fiche {f.numero_fiche}
              </div>

              <div className="text-sm text-gray-500">
                Année {f.annee}
              </div>

              <div className="text-sm text-gray-500">
                Responsable : {f.responsable_nom}
              </div>

            </div>

            <div className="flex gap-3 items-center">

              <StatusBadge status={f.statut} />

              <Link
                href={`/dashboard/fiche1/${f.id}`}
                className="px-3 py-1 border rounded"
              >
                Voir
              </Link>

              <a
                href={`/api/pdf/fiche1/${f.id}`}
                target="_blank"
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                PDF
              </a>

            </div>

          </div>

        ))}

      </div>

    </AppShell>

  )
}
