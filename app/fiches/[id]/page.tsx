import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { supabaseServerClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function FicheDetailPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  // Récupérer le rôle du user connecté
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  const role = (profile?.role ?? "agent") as Role

  // Récupérer la fiche (+ auteur via profiles)
  // ⚠️ note: le join "profiles(...)" marche si tu as une FK answers_fiche1.user_id -> profiles.id
  const { data: fiche, error } = await supabase
    .from("answers_fiche1")
    .select(
      "id,user_id,titre,annee,numero_fiche,statut,statut_validation,validation_comment,validated_at,created_at,updated_at,data,profiles:profiles(full_name,email)"
    )
    .eq("id", params.id)
    .maybeSingle()

  if (error || !fiche) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Fiche introuvable</div>
  }

  // Vérifier les droits d'accès (UI-side)
  const isOwner = fiche.user_id === session.user.id
  const isAdmin = role === "admin"
  const isValidator = role === "validateur" && fiche.statut === "soumis"

  if (!isOwner && !isValidator && !isAdmin) {
    return <div className="mx-auto max-w-4xl px-4 py-8">Accès non autorisé</div>
  }

  const getStatusBadge = () => {
    if (fiche.statut === "brouillon") return <Badge variant="warning">Brouillon</Badge>
    if (fiche.statut === "soumis") {
      if (fiche.statut_validation === null) return <Badge variant="secondary">En attente</Badge>
      if (fiche.statut_validation === "valide") return <Badge variant="success">Validé</Badge>
      if (fiche.statut_validation === "rejete") return <Badge variant="destructive">Rejeté</Badge>
    }
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-instat-blue">{fiche.titre}</h1>
          <p className="text-sm text-muted-foreground">
            Consultation — {role === "agent" ? "Agent" : role === "validateur" ? "Validateur" : "Admin"}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la fiche</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Année</p>
              <p className="font-semibold">{fiche.annee ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Numéro de fiche</p>
              <p className="font-semibold">{fiche.numero_fiche || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Créée le</p>
              <p className="font-semibold">
                {fiche.created_at
                  ? format(new Date(fiche.created_at), "dd MMM yyyy HH:mm", { locale: fr })
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Dernière modification</p>
              <p className="font-semibold">
                {fiche.updated_at
                  ? format(new Date(fiche.updated_at), "dd MMM yyyy HH:mm", { locale: fr })
                  : "-"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Auteur</p>
              <p className="font-semibold">
                {fiche.profiles?.full_name || "-"}{" "}
                <span className="text-sm text-muted-foreground">
                  ({fiche.profiles?.email || "-"})
                </span>
              </p>
            </div>
          </div>

          {fiche.validated_at && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Validation</h3>
              <p className="text-sm">
                {fiche.statut_validation === "valide" ? "Validé" : "Rejeté"} le{" "}
                {format(new Date(fiche.validated_at), "dd MMM yyyy", { locale: fr })}
              </p>

              {fiche.validation_comment && (
                <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                  <span className="font-semibold">Commentaire :</span> {fiche.validation_comment}
                </div>
              )}
            </div>
          )}

          {fiche.data && Object.keys(fiche.data).length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Données</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(fiche.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
