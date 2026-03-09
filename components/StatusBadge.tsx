export function StatusBadge({ status }: { status: string }) {

  const map: Record<string,string> = {
    brouillon: "bg-gray-200 text-gray-800",
    soumis: "bg-yellow-200 text-yellow-800",
    valide: "bg-green-200 text-green-800",
    rejete: "bg-red-200 text-red-800"
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  )
}
