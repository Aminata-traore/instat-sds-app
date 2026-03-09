export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import { supabaseServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/app/_components/AppShell"
import { DocumentActions } from "@/components/DocumentActions"
import { StatusBadge } from "@/components/StatusBadge"

export default async function FichePage({ params }:{params:{id:string}}) {

  const supabase = supabaseServerClient(cookies())

  const { data:fiche } = await supabase
  .from("fiche1")
  .select("*")
  .eq("id",params.id)
  .single()

  return (

    <AppShell title="Consultation fiche">

      <DocumentActions ficheId={fiche.id}/>

      <div className="border rounded-xl p-6 bg-white space-y-4">

        <div className="flex justify-between">

          <div>

            <div className="text-lg font-bold">
              Fiche {fiche.numero_fiche}
            </div>

            <div className="text-sm text-gray-500">
              Année {fiche.annee}
            </div>

          </div>

          <StatusBadge status={fiche.statut}/>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <div className="text-sm text-gray-500">Responsable</div>
            <div>{fiche.responsable_nom}</div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Statut</div>
            <div>{fiche.statut}</div>
          </div>

        </div>

      </div>

    </AppShell>

  )
}
