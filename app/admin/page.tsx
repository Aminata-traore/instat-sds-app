import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle, ClipboardList } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  // Admin only (tu peux élargir à validateur si tu veux)
  if (profile?.role !== "admin") redirect("/dashboard")

  // ✅ Stats centrées sur FICHE 1 (nouvelle structure)
  const { count: totalFiches } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })

  const { count: enAttente } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "soumis")

  const { count: totalLignes } = await supabase
    .from("fiche1_activites")
    .select("id", { count: "exact", head: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Administration</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Supervision et validation — Fiche 1.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiches Fiche 1</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiches ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente (soumis)</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enAttente ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes d’activités</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLignes ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/fiche1" className="block p-2 hover:bg-gray-100 rounded">
              → Valider les fiches Fiche 1
            </Link>
            <Link href="/fiche1/mes-fiches" className="block p-2 hover:bg-gray-100 rounded">
              → Voir mes fiches (test admin)
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
