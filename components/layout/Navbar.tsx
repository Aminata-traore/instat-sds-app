"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { LogOut, User, Settings, FileText, Home, CheckCircle2 } from "lucide-react"

import { supabaseClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function Navbar() {
  const router = useRouter()
  const supabase = useMemo(() => supabaseClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      const { data: sess } = await supabase.auth.getSession()
      const session = sess.session
      if (!session?.user) {
        if (alive) setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,created_at,updated_at")
        .eq("id", session.user.id)
        .maybeSingle()

      if (!alive) return
      if (error) {
        setProfile(null)
        return
      }
      setProfile((data as Profile) ?? null)
    }

    load()

    // si l’utilisateur se connecte/déconnecte, on refresh
    const { data: auth } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      alive = false
      auth.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const initials = (name: string | null) => {
    if (!name) return "U"
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // règles d’affichage (UI) — la vraie sécurité reste RLS + middleware
  const canValidate = profile?.role === "validateur" || profile?.role === "admin"
  const isAdmin = profile?.role === "admin"

  return (
    <nav className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-instat-blue text-white grid place-items-center font-bold">
            I
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold text-instat-blue">INSTAT</div>
            <div className="text-xs text-muted-foreground">SDS — Activités</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {profile && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link href="/fiches">
                  <FileText className="mr-2 h-4 w-4" />
                  Mes fiches
                </Link>
              </Button>

              {canValidate && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/validator">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Validation
                  </Link>
                </Button>
              )}

              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {profile.full_name ?? "Utilisateur"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Rôle : <span className="font-semibold">{profile.role}</span>
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
