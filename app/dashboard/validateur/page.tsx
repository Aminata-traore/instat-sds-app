export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";

export default async function ValidateurDashboardPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/validateur");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur chargement profil validateur:", error);
    redirect("/profile");
  }

  if (!profile?.role) {
    redirect("/profile");
  }

  if (profile.role === "agent") {
    redirect("/dashboard/agent");
  }

  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (profile.role !== "validateur") {
    redirect("/profile");
  }

  const { count: enAttente } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "soumis");

  const { count: validees } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "valide");

  const { count: rejetees } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "rejete");

  return (
    <AppShell title="Dashboard Validateur">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="En attente" value={enAttente ?? 0} />
          <StatCard label="Validées" value={validees ?? 0} />
          <StatCard label="Rejetées" value={rejetees ?? 0} />
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold">Contrôle des fiches</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Vérifier les fiches soumises par les agents, puis accepter ou refuser.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Ouvrir la validation
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
