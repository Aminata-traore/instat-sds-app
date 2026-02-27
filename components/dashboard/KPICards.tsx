"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import type { Role } from "@/lib/types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"

interface KPICardsProps {
  userId: string
  role: Role
}

type Row = {
  statut: "brouillon" | "soumis"
  statut_validation: "valide" | "rejete" | null
}

export default function KPICards({ userId, role }: KPICardsProps) {
  const supabase = useMemo(() => supabaseClient(), [])
  const [counts, setCounts] = useState({
    total: 0,
    brouillons: 0,
    soumis: 0,
    validees: 0,
    rejetees: 0,
  })

  useEffect(() => {
    let alive = true

    const fetchCounts = async () => {
      // On ne prend que les champs utiles (plus rapide que select '*')
      let query = supabase
        .from("answers_fiche1")
        .select("statut,statut_validation")

      // ⚠️ RLS doit déjà limiter mais on filtre aussi en UI selon rôle
      if (role === "agent") query = query.eq("user_id", userId)
      if (role === "validateur") query = query.eq("statut", "soumis")
      // admin voit tout

      const { data, error } = await query
      if (!alive) return

      if (error) {
        console.error(error)
        return
      }

      const rows = (data ?? []) as Row[]

      const total = rows.length
      const brouillons = rows.filter((f) => f.statut === "brouillon").length
      const soumis = rows.filter((f) => f.statut === "soumis" && f.statut_validation === null).length
      const validees = rows.filter((f) => f.statut_validation === "valide").length
      const rejetees = rows.filter((f) => f.statut_validation === "rejete").length

      setCounts({ total, brouillons, soumis, validees, rejetees })
    }

    fetchCounts()
    return () => {
      alive = false
    }
  }, [userId, role, supabase])

  const cards = [
    { title: "Total fiches", value: counts.total, icon: FileText, color: "text-instat-blue" },
    { title: "Brouillons", value: counts.brouillons, icon: Clock, color: "text-yellow-700" },
    { title: "En attente", value: counts.soumis, icon: Clock, color: "text-orange-700" },
    { title: "Validées", value: counts.validees, icon: CheckCircle, color: "text-green-700" },
    { title: "Rejetées", value: counts.rejetees, icon: XCircle, color: "text-red-700" },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
