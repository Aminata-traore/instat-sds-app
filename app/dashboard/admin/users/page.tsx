export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import CreateUserForm from "./CreateUserForm";
import UpdateUserRow from "./UpdateUserRow";

export default async function AdminUsersPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/admin/users");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!me || me.role !== "admin" || me.is_active === false) {
    redirect("/profile");
  }

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <AppShell title="Gestion des utilisateurs">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Erreur lors du chargement des utilisateurs : {error.message}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Gestion des utilisateurs">
      <div className="space-y-6">
        <CreateUserForm />

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Liste des comptes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Nom</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((user) => (
                  <UpdateUserRow key={user.id} user={user} currentAdminId={session.user.id} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
