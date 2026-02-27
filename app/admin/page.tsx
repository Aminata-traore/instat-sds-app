import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, CheckCircle, Settings } from "lucide-react"
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

  if (profile?.role !== "admin") redirect("/dashboard")

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })

  const { count: totalFiches } = await supabase
    .from("answers_fiche1")
    .select("id", { count: "exact", head: true })

  const { count: enAttente } = await supabase
    .from("answers_fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "soumis")
    .is("statut_validation", null)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Administration</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Gestion des utilisateurs et supervision globale.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/admin/users" className="block">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers ?? 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiches totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiches ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enAttente ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accès rapide</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Gestion / supervision
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestion rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users" className="block p-2 hover:bg-gray-100 rounded">
              → Gérer les utilisateurs (rôles)
            </Link>
            <Link href="/fiches" className="block p-2 hover:bg-gray-100 rounded">
              → Voir les fiches (selon RLS)
            </Link>
            <Link href="/validator" className="block p-2 hover:bg-gray-100 rounded">
              → Espace validation
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
