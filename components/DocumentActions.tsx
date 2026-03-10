"use client"

import { useRouter } from "next/navigation"

export function DocumentActions({ ficheId }: { ficheId: string }) {

  const router = useRouter()

  const print = () => window.print()

  return (
    <div className="flex gap-3 mb-6">

      <button
        onClick={() => router.back()}
        className="px-4 py-2 border rounded"
      >
        Retour
      </button>

      <button
        onClick={print}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Imprimer
      </button>

      <a
        href={`/api/pdf/fiche1/${ficheId}`}
        target="_blank"
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Télécharger PDF
      </a>

    </div>
  )
}
