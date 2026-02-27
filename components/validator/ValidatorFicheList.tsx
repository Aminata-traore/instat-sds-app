"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { supabaseClient } from "@/lib/supabase/client"
import type { Fiche1 } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Eye } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FicheRow = Fiche1 & {
  profiles?: { full_name: string | null; email: string }
}

export default function ValidatorFicheList() {
  const supabase = useMemo(() => supabaseClient(), [])

  const [fiches, setFiches] = useState<FicheRow[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedFiche, setSelectedFiche] = useState<FicheRow | null>(null)
  const [comment, setComment] = useState("")
  const [decision, setDecision] = useState<"valide" | "rejete" | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchFiches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFiches = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("answers_fiche1")
      .select(
        "id,user_id,titre,annee,numero_fiche,statut,statut_validation,created_at,profiles:profiles(full_name,email)"
      )
      .eq("statut", "soumis")
      .is("statut_validation", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setFiches([])
    } else {
      setFiches((data as FicheRow[]) || [])
    }

    setLoading(false)
  }

  const openDecision = (fiche: FicheRow, d: "valide" | "rejete") => {
    setSelectedFiche(fiche)
    setDecision(d)
    setComment("")
    setOpenDialog(true)
  }

  const handleValidate = async () => {
    if (!selectedFiche || !decision) return

    setBusy(true)
    try {
      const { data: u, error: uErr } = await supabase.auth.getUser()
      if (uErr) throw new Error(uErr.message)
      const uid = u.user?.id
      if (!uid) throw new Error("Utilisateur non connecté")

      const updates = {
        statut_validation: decision,
        validation_comment: decision === "rejete" ? (comment.trim() || null) : null,
        validated_at: new Date().toISOString(),
        validated_by: uid,
      }

      const { error } = await supabase
        .from("answers_fiche1")
        .update(updates)
        .eq("id", selectedFiche.id)

      if (error) throw new Error(error.message)

      // Optimiste : on retire de la liste
      setFiches((prev) => prev.filter((f) => f.id !== selectedFiche.id))

      setOpenDialog(false)
      setSelectedFiche(null)
      setComment("")
      setDecision(null)
    } catch (e: any) {
      alert(e?.message ?? "Erreur inconnue")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>
  }

  if (fiches.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted">
        <p className="text-muted-foreground">Aucune fiche en attente de validation.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fiches.map((fiche) => (
          <Card key={fiche.id}>
            <CardHeader>
              <CardTitle className="text-lg">{fiche.titre}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">En attente</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(fiche.created_at), "dd MMM yyyy", { locale: fr })}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-1">
              <p className="text-sm">Année : {fiche.annee ?? "-"}</p>
              <p className="text-sm text-muted-foreground">
                Agent : {fiche.profiles?.full_name ?? "-"}
              </p>
            </CardContent>

            <CardFooter className="flex justify-end gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/fiches/${fiche.id}`}>
                  <Eye className="h-4 w-4 mr-1" /> Voir
                </Link>
              </Button>

              <Button size="sm" onClick={() => openDecision(fiche, "valide")}>
                <CheckCircle className="h-4 w-4 mr-1" /> Valider
              </Button>

              <Button size="sm" variant="destructive" onClick={() => openDecision(fiche, "rejete")}>
                <XCircle className="h-4 w-4 mr-1" /> Rejeter
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog
        open={openDialog}
        onOpenChange={(v) => {
          if (!busy) setOpenDialog(v)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "valide" ? "Valider la fiche" : "Rejeter la fiche"}
            </DialogTitle>
            <DialogDescription>
              {decision === "rejete"
                ? "Veuillez indiquer la raison du rejet."
                : "Confirmez-vous la validation de cette fiche ?"}
            </DialogDescription>
          </DialogHeader>

          {decision === "rejete" && (
            <div className="space-y-2">
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Raison du rejet..."
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={busy}>
              Annuler
            </Button>

            <Button
              variant={decision === "valide" ? "default" : "destructive"}
              onClick={handleValidate}
              disabled={busy || (decision === "rejete" && !comment.trim())}
            >
              {busy ? "..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
