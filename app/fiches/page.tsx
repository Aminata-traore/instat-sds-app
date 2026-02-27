import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { supabaseServerClient } from "@/lib/supabase/server"
import type { Role } from "@/lib/types"

import FicheList from "@/components/fiche/FicheList"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default async function FichesPage() {
  const supabase = supabaseServerClient(cookies())

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  const role = (profile?.role ?? "agent") as Role

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-extrabold text-instat-blue">
          Mes fiches
        </h1>

        {role === "agent" && (
          <Button asChild>
            <Link href="/fiches/nouvelle">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle fiche
            </Link>
          </Button>
        )}
      </div>

      <FicheList userId={session.user.id} role={role} />
    </div>
  )
}
