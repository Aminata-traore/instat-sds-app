export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import { AdminStatsChart } from "@/components/charts/AdminStatsChart";

export default async function AdminStatsPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login?redirectTo=/dashboard/admin/stats");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: fiches } = await supabase.from("fiche1").select("*");

  const byStatusMap: Record<string, number> = {};
  const byYearMap: Record<string, number> = {};

  for (const f of fiches || []) {
    byStatusMap[f.statut] = (byStatusMap[f.statut] || 0) + 1;
    byYearMap[String(f.annee)] = (byYearMap[String(f.annee)] || 0) + 1;
  }

  const byStatus = Object.entries(byStatusMap).map(([name, total]) => ({
    name,
    total,
  }));

  const byYear = Object.entries(byYearMap).map(([name, total]) => ({
    name,
    total,
  }));

  return (
    <AppShell title="Statistiques Admin">
      <div className="space-y-8">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold mb-4">Fiches par statut</h2>
          <AdminStatsChart data={byStatus} />
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-semibold mb-4">Fiches par année</h2>
          <AdminStatsChart data={byYear} />
        </div>
      </div>
    </AppShell>
  );
}
