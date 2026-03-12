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

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/agent");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur chargement profil agent:", error);
  }

  // ✅ fallback : si pas de profil ou role vide, on considère agent
  const role = profile?.role ?? "agent";

  if (role === "validateur") {
    redirect("/dashboard/validateur");
  }

  if (role === "admin") {
    redirect("/dashboard/admin");
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
          <StatCard label="Total" value={totalFiches ?? 0} />
          <StatCard label="Brouillons" value={brouillons ?? 0} />
          <StatCard label="Soumises" value={soumises ?? 0} />
          <StatCard label="Validées" value={validees ?? 0} />
          <StatCard label="Rejetées" value={rejetees ?? 0} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ActionCard
            title="Nouvelle fiche"
            text="Créer une nouvelle fiche 1 et l’enregistrer en brouillon ou la soumettre."
            href="/dashboard/fiche1/new"
            cta="Créer une fiche"
            primary
          />
          <ActionCard
            title="Mes fiches"
            text="Voir mes brouillons, mes soumissions, mes validations et mes rejets."
            href="/dashboard/fiche1"
            cta="Ouvrir mes fiches"
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
