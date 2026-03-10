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

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/admin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur chargement profil admin:", error);
    redirect("/auth/login");
  }

  const role = profile?.role;

  if (role === "agent") {
    redirect("/dashboard/agent");
  }

  if (role === "validateur") {
    redirect("/dashboard/validateur");
  }

  if (role !== "admin") {
    redirect("/auth/login");
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
          <StatCard label="Fiches totales" value={totalFiches ?? 0} />
          <StatCard label="Agents" value={totalAgents ?? 0} />
          <StatCard label="Validateurs" value={totalValidateurs ?? 0} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            title="Validation"
            text="Contrôler et suivre les fiches soumises."
            href="/admin"
            cta="Ouvrir"
            primary
          />
          <ActionCard
            title="Statistiques"
            text="Analyser les fiches par statut et par année."
            href="/dashboard/admin/stats"
            cta="Voir les stats"
          />
          <ActionCard
            title="Export"
            text="Télécharger les données sous Excel."
            href="/api/export/fiche1"
            cta="Exporter"
          />
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

function ActionCard({
  title,
  text,
  href,
  cta,
  primary,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{text}</p>
      <Link
        href={href}
        className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold ${
          primary ? "bg-black text-white" : "border"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
