export const dynamic = "force-dynamic"

import { cookies } from "next/headers"
import { supabaseServerClient } from "@/lib/supabase/server"
import { AppShell } from "@/app/_components/AppShell"
import { StatusBadge } from "@/components/StatusBadge"
import { DocumentActions } from "@/components/DocumentActions"

export default async function FichePage({ params }: any) {

  const supabase = supabaseServerClient(cookies())

  const { data: fiche } = await supabase
    .from("fiche1")
    .select("*")
    .eq("id", params.id)
    .single()

  const { data: answers } = await supabase
    .from("answers_fiche1")
    .select("*")
    .eq("fiche1_id", params.id)
    .order("question_code")

  return (

    <AppShell title="Consultation fiche">

      <DocumentActions ficheId={fiche.id} />

      <div className="border rounded-xl p-6 bg-white space-y-6">

        <div className="flex justify-between">

          <div>

            <div className="text-xl font-bold">
              Fiche {fiche.numero_fiche}
            </div>

            <div className="text-sm text-gray-500">
              Année {fiche.annee}
            </div>

          </div>

          <StatusBadge status={fiche.statut} />

        </div>

        <div className="space-y-3">

          {answers?.map((a:any)=>{

            const value =
              a.value_text ??
              a.value_number ??
              a.value_bool ??
              JSON.stringify(a.value_json ?? "")

            return (

              <div
                key={a.id}
                className="border p-3 rounded bg-gray-50"
              >

                <div className="text-sm font-semibold">
                  {a.question_code}
                </div>

                <div className="text-sm text-gray-700">
                  {value}
                </div>

              </div>

            )
          })}

        </div>

      </div>

    </AppShell>

  )
}
