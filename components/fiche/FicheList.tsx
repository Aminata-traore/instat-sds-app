"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import type { Fiche1, Role } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { Edit, Eye, Send, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface FicheListProps {
  userId: string
  role: Role
}

export default function FicheList({ userId, role }: FicheListProps) {
  const supabase = useMemo(() => supabaseClient(), [])
  const [fiches, setFiches] = useState<Fiche1[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const fetchFiches = async () => {
      setLoading(true)

      let query = supabase
        .from("answers_fiche1")
        .select(
          "id,titre,annee,numero_fiche,statut,statut_validation,validation_comment,created_at"
        )
        .order("created_at", { ascending: false })

      if (role === "agent") query = query.eq("user_id", userId)
      if (role === "validateur") query = query.eq("statut", "soumis")

      const { data, error } = await query
      if (!alive) return

      if (error) {
        console.error(error)
      } else {
        setFiches((data as Fiche1[]) || [])
      }

      setLoading(false)
    }

    fetchFiches()
    return () => {
      alive = false
    }
  }, [userId, role, supabase])

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette fiche ?")) return

    const { error } = await supabase
      .from("answers_fiche1")
      .delete()
      .eq("id", id)

    if (!error) {
      setFiches((prev) => prev.filter((f) => f.id !== id))
    }
  }

  const handleSubmit = async (id: string) => {
    const { error } = await supabase
      .from("answers_fiche1")
      .update({ statut: "soumis", statut_validation: null })
      .eq("id", id)

    if (!error) {
      setFiches((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, statut: "soumis", statut_validation: null } : f
        )
      )
    }
  }

  const getStatusBadge = (fiche: Fiche1) => {
    if (fiche.statut === "brouillon")
      return <Badge variant="warning">Brouillon</Badge>

    if (fiche.statut === "soumis") {
      if (fiche.statut_validation === null)
        return <Badge variant="secondary">En attente</Badge>

      if (fiche.statut_validation === "valide")
        return <Badge variant="success">Validé</Badge>

      if (fiche.statut_validation === "rejete")
        return <Badge variant="destructive">Rejeté</Badge>
    }

    return null
  }

  if (loading)
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>

  if (fiches.length === 0)
    return (
      <div className="text-center py-12 border rounded-lg bg-muted">
        <p className="text-muted-foreground">Aucune fiche trouvée.</p>
        {role === "agent" && (
          <Button asChild className="mt-4">
            <Link href="/fiches/nouvelle">Créer votre première fiche</Link>
          </Button>
        )}
      </div>
    )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {fiches.map((fiche) => (
        <Card key={fiche.id}>
          <CardHeader>
            <CardTitle className="text-lg">{fiche.titre}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(fiche)}
              <span className="text-xs text-muted-foreground">
                {format(new Date(fiche.created_at), "dd MMM yyyy", { locale: fr })}
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm">Année : {fiche.annee ?? "-"}</p>
            {fiche.numero_fiche && (
              <p className="text-sm">N° fiche : {fiche.numero_fiche}</p>
            )}
            {fiche.statut_validation === "rejete" && fiche.validation_comment && (
              <p className="text-sm text-red-600 mt-2">
                Commentaire : {fiche.validation_comment}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            {role === "agent" && fiche.statut === "brouillon" && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/fiches/${fiche.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSubmit(fiche.id)}
                >
                  <Send className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(fiche.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {(role === "admin" ||
              role === "validateur" ||
              fiche.statut === "soumis") && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/fiches/${fiche.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
