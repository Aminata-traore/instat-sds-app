export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AdminValidationPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login?redirectTo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile?.role !== "validateur" && profile?.role !== "admin") {
    redirect("/dashboard/agent");
  }

  const { data: fiches } = await supabase
    .from("fiche1")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Validation des fiches">
      <div className="space-y-4">
        {fiches?.map((f) => (
          <div
            key={f.id}
            className="rounded-2xl border bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="font-semibold">Fiche {f.numero_fiche}</div>
              <div className="text-sm text-gray-500">Année {f.annee}</div>
              <div className="text-sm text-gray-500">
                Responsable : {f.responsable_nom}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={f.statut} />

              <Link
                href={`/admin/fiche1/${f.id}`}
                className="px-3 py-2 rounded-lg border text-sm font-medium"
              >
                Vérifier
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
