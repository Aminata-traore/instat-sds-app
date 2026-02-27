import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

  // Si la ligne profile n'existe pas (trigger pas exécuté, ou compte importé, etc.)
  // on affiche une page "safe" au lieu de planter.
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Mon profil</h1>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur lors du chargement du profil : {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Mon profil</h1>

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
            <p className="font-medium">{profile?.email || session.user.email || "-"}</p>
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
              <Link href="/auth/change-password">Changer le mot de passe</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!profile && (
        <div className="mt-4 rounded-md border bg-yellow-50 p-4 text-sm text-yellow-800">
          ⚠️ Profil non trouvé dans la table <b>profiles</b>. <br />
          Ça arrive si le trigger de création de profile n’a pas été exécuté. <br />
          Solution : re-créer l’utilisateur, ou insérer la ligne profile manuellement.
        </div>
      )}
    </div>
  )
}
