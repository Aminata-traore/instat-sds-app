import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import UserManagement from "@/components/admin/UserManagement"

export default async function AdminUsersPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (profile?.role !== "admin") redirect("/dashboard")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-blue-900 mb-2">Gestion des utilisateurs</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Changer les rôles : agent / validateur / admin.
      </p>
      <UserManagement />
    </div>
  )
}
