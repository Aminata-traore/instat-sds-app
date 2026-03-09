export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";

export default async function AgentDashboardPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login?redirectTo=/dashboard/agent");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile?.role !== "agent") {
    if (profile?.role === "validateur") redirect("/dashboard/validateur");
    if (profile?.role === "admin") redirect("/dashboard/admin");
    redirect("/dashboard");
  }

  const { count: totalFiches } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.user.id);

  const { count: brouillons } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.user.id)
    .eq("statut", "brouillon");

  const { count: soumises } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.user.id)
    .eq("statut", "soumis");

  const { count: validees } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.user.id)
    .eq("statut", "valide");

  const { count: rejetees } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("created_by", session.user.id)
    .eq("statut", "rejete");

  return (
    <AppShell title="Dashboard Agent">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Total</div>
            <div className="text-2xl font-bold">{totalFiches ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Brouillons</div>
            <div className="text-2xl font-bold">{brouillons ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Soumises</div>
            <div className="text-2xl font-bold">{soumises ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Validées</div>
            <div className="text-2xl font-bold">{validees ?? 0}</div>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-neutral-500">Rejetées</div>
            <div className="text-2xl font-bold">{rejetees ?? 0}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Nouvelle saisie</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Créer une nouvelle fiche 1 et l’enregistrer en brouillon ou la soumettre.
            </p>
            <Link
              href="/dashboard/fiche1/new"
              className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Nouvelle fiche
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <h2 className="text-lg font-semibold">Mes fiches</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Consulter vos brouillons, vos soumissions et les décisions de validation.
            </p>
            <Link
              href="/dashboard/fiche1"
              className="mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Voir mes fiches
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
