import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseServerClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

import KPICards from "@/components/dashboard/KPICards"
import Charts from "@/components/dashboard/Charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,updated_at")
    .eq("id", session.user.id)
    .maybeSingle()

  const role = (profile?.role ?? "agent") as Role

  const roleLabel =
    role === "agent" ? "Agent de saisie" : role === "validateur" ? "Validateur" : "Administrateur"

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-instat-blue">
          Bienvenue, {profile?.full_name || "Utilisateur"}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rôle :</span>
          <Badge
            variant={role === "admin" ? "info" : role === "validateur" ? "warning" : "secondary"}
          >
            {roleLabel}
          </Badge>
        </div>
      </div>

      <div className="mt-6">
        <KPICards userId={session.user.id} role={role} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts type="status" userId={session.user.id} role={role} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution annuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <Charts type="yearly" userId={session.user.id} role={role} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
