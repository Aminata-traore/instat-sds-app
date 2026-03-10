export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";

const PAGE_SIZE = 10;

export default async function FichesPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login?redirectTo=/dashboard/fiche1");

  const page = Math.max(1, Number(searchParams?.page || "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: fiches, count } = await supabase
    .from("fiche1")
    .select("*", { count: "exact" })
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <AppShell title="Mes fiches">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <Link
          href="/dashboard/fiche1/new"
          className="px-4 py-2 rounded-lg bg-black text-white font-semibold"
        >
          Nouvelle fiche
        </Link>

        <a
          href="/api/export/fiche1"
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
        >
          Export Excel
        </a>
      </div>

      <div className="space-y-4">
        {fiches?.length ? (
          fiches.map((f) => (
            <div
              key={f.id}
              className="border rounded-xl p-4 flex flex-col gap-3 bg-white md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-semibold">Fiche {f.numero_fiche}</div>
                <div className="text-sm text-gray-500">Année {f.annee}</div>
                <div className="text-sm text-gray-500">
                  Responsable : {f.responsable_nom}
                </div>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <StatusBadge status={f.statut} />

                <Link
                  href={`/dashboard/fiche1/${f.id}`}
                  className="px-3 py-2 border rounded-lg text-sm font-medium"
                >
                  Voir
                </Link>

                <a
                  href={`/api/pdf/fiche1/${f.id}`}
                  target="_blank"
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  PDF
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            Aucune fiche enregistrée pour le moment.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <Link
          href={`/dashboard/fiche1?page=${Math.max(1, page - 1)}`}
          className={`px-4 py-2 rounded-lg border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
        >
          Précédent
        </Link>

        <div className="text-sm text-gray-500">
          Page {page} / {totalPages}
        </div>

        <Link
          href={`/dashboard/fiche1?page=${Math.min(totalPages, page + 1)}`}
          className={`px-4 py-2 rounded-lg border ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
        >
          Suivant
        </Link>
      </div>
    </AppShell>
  );
}
