"use client"

import { useRouter } from "next/navigation"

export function DocumentActions({ ficheId }: { ficheId:string }) {

  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    window.open(`/api/pdf/fiche1/${ficheId}`,"_blank")
  }

  return (

    <div className="flex gap-3 mb-6">

      <button
        onClick={() => router.back()}
        className="px-4 py-2 border rounded-lg"
      >
        Retour
      </button>

      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Imprimer
      </button>

      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-green-600 text-white rounded-lg"
      >
        Télécharger PDF
      </button>

    </div>
  )
}
