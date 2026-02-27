import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Fusionne proprement les classes Tailwind
 * (évite les conflits comme p-2 + p-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

/* =========================
   Helpers INSTAT
========================= */

/**
 * Formate une date ISO en format lisible FR
 */
export function formatDate(date: string | null | undefined) {
  if (!date) return "-"
  return new Date(date).toLocaleString("fr-FR")
}

/**
 * Badge couleur selon statut fiche
 */
export function getStatutColor(statut: string | null) {
  switch (statut) {
    case "brouillon":
      return "bg-gray-200 text-gray-800"
    case "soumis":
      return "bg-blue-100 text-blue-800"
    case "valide":
      return "bg-green-100 text-green-800"
    case "rejete":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-600"
  }
}
