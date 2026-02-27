"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { format } from "date-fns"
import { fr } from "date-fns/locale"

type Role = "agent" | "validateur" | "admin"

export default function UserManagement() {
  const supabase = useMemo(() => createClient(), [])

  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setError(error.message)
      setUsers([])
    } else {
      setUsers((data as Profile[]) || [])
    }

    setLoading(false)
  }

  const updateRole = async (userId: string, newRole: Role) => {
    setError(null)
    setBusyId(userId)

    // Optimistic UI
    const prev = users
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, role: newRole } : x)))

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)

    if (error) {
      console.error(error)
      setError(error.message)
      // rollback
      setUsers(prev)
    }

    setBusyId(null)
  }

  const badgeVariant = (role: Role) => {
    if (role === "admin") return "destructive"
    if (role === "validateur") return "success"
    return "secondary"
  }

  const roleLabel = (role: Role) => {
    if (role === "admin") return "Admin"
    if (role === "validateur") return "Validateur"
    return "Agent"
  }

  if (loading) return <div className="text-muted-foreground">Chargement...</div>

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Erreur : {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {users.length} utilisateur(s)
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          Rafraîchir
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => {
              const role = (user.role ?? "agent") as Role

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(role)}>{roleLabel(role)}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.created_at
                      ? format(new Date(user.created_at), "dd MMM yyyy", { locale: fr })
                      : "-"}
                  </TableCell>

                  <TableCell className="text-right">
                    <Select
                      value={role}
                      onValueChange={(value) => updateRole(user.id, value as Role)}
                      disabled={busyId === user.id}
                    >
                      <SelectTrigger className="w-[160px] ml-auto">
                        <SelectValue placeholder="Changer rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="validateur">Validateur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
