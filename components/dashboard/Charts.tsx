"use client"

import { useEffect, useMemo, useState } from "react"
import { supabaseClient } from "@/lib/supabase/client"
import type { Role } from "@/lib/types"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface ChartsProps {
  type: "status" | "yearly"
  userId: string
  role: Role
}

type Row = {
  annee: number | null
  statut: "brouillon" | "soumis"
  statut_validation: "valide" | "rejete" | null
}

export default function Charts({ type, userId, role }: ChartsProps) {
  const supabase = useMemo(() => supabaseClient(), [])
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    let alive = true

    const fetchData = async () => {
      let query = supabase
        .from("answers_fiche1")
        .select("annee,statut,statut_validation")

      if (role === "agent") query = query.eq("user_id", userId)
      if (role === "validateur") query = query.eq("statut", "soumis")

      const { data, error } = await query
      if (!alive) return

      if (error) {
        console.error(error)
        return
      }

      const rows = (data ?? []) as Row[]

      if (type === "status") {
        const brouillon = rows.filter((f) => f.statut === "brouillon").length
        const soumis = rows.filter((f) => f.statut === "soumis" && f.statut_validation === null).length
        const valide = rows.filter((f) => f.statut_validation === "valide").length
        const rejete = rows.filter((f) => f.statut_validation === "rejete").length

        setData([
          { name: "Brouillon", value: brouillon },
          { name: "Soumis", value: soumis },
          { name: "Validé", value: valide },
          { name: "Rejeté", value: rejete },
        ])
        return
      }

      // yearly
      const years: Record<number, number> = {}
      rows.forEach((f) => {
        if (typeof f.annee === "number") {
          years[f.annee] = (years[f.annee] || 0) + 1
        }
      })

      const chartData = Object.keys(years)
        .map((y) => Number(y))
        .sort((a, b) => a - b)
        .map((annee) => ({ annee: String(annee), count: years[annee] }))

      setData(chartData)
    }

    fetchData()
    return () => {
      alive = false
    }
  }, [type, userId, role, supabase])

  const COLORS = ["#0B3A69", "#2E86C1", "#F4B400", "#DB4437"]

  if (type === "status") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={90}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="annee" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#0B3A69" />
      </BarChart>
    </ResponsiveContainer>
  )
}
