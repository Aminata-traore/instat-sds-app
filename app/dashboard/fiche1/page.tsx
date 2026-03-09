export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import Link from "next/link"
import { supabaseServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/app/_components/AppShell"
import { StatusBadge } from "@/components/StatusBadge"

export default async function FichesPage() {

  const supabase = supabaseServerClient(cookies())

  const { data:fiches } = await supabase
  .from("fiche1")
  .select("*")
  .order("created_at",{ascending:false})

  return (

    <AppShell title="Mes fiches">

      <div className="space-y-4">

      {fiches?.map(f => (

        <div
        key={f.id}
        className="border rounded-xl p-4 bg-white flex justify-between items-center"
        >

          <div>

            <div className="font-semibold">
              Fiche {f.numero_fiche}
            </div>

            <div className="text-sm text-gray-500">
              Année {f.annee}
            </div>

          </div>

          <div className="flex items-center gap-3">

            <StatusBadge status={f.statut} />

            <Link
            href={`/dashboard/fiche1/${f.id}`}
            className="px-3 py-1 border rounded"
            >
              Voir
            </Link>

          </div>

        </div>

      ))}

      </div>

    </AppShell>

  )
}
