import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AppShell } from "@/app/_components/AppShell"

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", session.user.id)
    .maybeSingle()

  if (error) {
    return (
      <AppShell title="Mon profil">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur lors du chargement du profil : {error.message}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Mon profil">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium">{profile?.full_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">
                {profile?.email || session.user.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="font-medium">
                {profile?.role === "agent"
                  ? "Agent de saisie"
                  : profile?.role === "validateur"
                  ? "Validateur"
                  : profile?.role === "admin"
                  ? "Administrateur"
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Membre depuis</p>
              <p className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("fr-FR")
                  : "-"}
              </p>
            </div>

            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/auth/change-password">
                  Changer le mot de passe
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {!profile && (
          <div className="mt-4 rounded-md border bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠️ Profil non trouvé dans la table <b>profiles</b>.
          </div>
        )}
      </div>
    </AppShell>
  )
}
