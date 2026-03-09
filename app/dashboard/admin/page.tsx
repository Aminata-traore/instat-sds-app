export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";

export default async function AdminDashboardPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login?redirectTo=/dashboard/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    if (profile?.role === "validateur") redirect("/dashboard/validateur");
    redirect("/dashboard/agent");
  }

  const { count: totalFiches } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true });

  const { count: totalAgents } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "agent");

  const { count: totalValidateurs } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "validateur");

  return (
    <AppShell title="Dashboard Admin">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Fiches totales</div>
            <div className="text-2xl font-bold">{totalFiches ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Agents</div>
            <div className="text-2xl font-bold">{totalAgents ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Validateurs</div>
            <div className="text-2xl font-bold">{totalValidateurs ?? 0}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Supervision</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Voir toutes les fiches, leur statut et suivre la progression globale.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Ouvrir l’administration
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Référentiels</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Gérer les structures, années, sources de financement et autres référentiels.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Gérer
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
