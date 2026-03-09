"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"

export default function ValidationPage({ fiche }) {

  const [loading,setLoading] = useState(false)

  const valider = async () => {

    setLoading(true)

    await supabase
    .from("fiche1")
    .update({statut:"valide"})
    .eq("id",fiche.id)

    location.reload()
  }

  const rejeter = async () => {

    const motif = prompt("Motif du rejet")

    if(!motif) return

    setLoading(true)

    await supabase
    .from("fiche1")
    .update({
      statut:"rejete",
      motif_rejet:motif
    })
    .eq("id",fiche.id)

    location.reload()
  }

  return (

    <div className="space-y-6">

      <h1 className="text-xl font-bold">
        Vérification fiche
      </h1>

      <div className="border rounded-xl p-6 bg-white">

        {/* contenu fiche ici */}

      </div>

      <div className="flex gap-4">

        <button
        onClick={valider}
        className="px-5 py-2 bg-green-600 text-white rounded-lg"
        >
          Accepter
        </button>

        <button
        onClick={rejeter}
        className="px-5 py-2 bg-red-600 text-white rounded-lg"
        >
          Refuser
        </button>

      </div>

    </div>
  )
}
