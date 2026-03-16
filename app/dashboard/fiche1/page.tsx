export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import SubmitDraftButton from "./SubmitDraftButton";

const PAGE_SIZE = 10;

type SearchParams = {
  page?: string;
};

export default async function FichesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/fiche1");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erreur chargement profil:", profileError);
    redirect("/profile");
  }

  if (!profile) {
    redirect("/profile");
  }

  if (profile.is_active === false) {
    redirect("/auth/login");
  }

  if (profile.role !== "agent") {
    if (profile.role === "validateur") {
      redirect("/dashboard/validateur");
    }

    if (profile.role === "admin") {
      redirect("/dashboard/admin");
    }

    redirect("/profile");
  }

  const page = Math.max(1, Number(searchParams?.page || "1"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: fiches,
    count,
    error: fichesError,
  } = await supabase
    .from("fiche1")
    .select(
      "id,numero_fiche,annee,responsable_nom,statut,created_at,created_by",
      { count: "exact" }
    )
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <AppShell title="Mes fiches">
      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <Link
          href="/dashboard/fiche1/new"
          className="rounded-lg bg-black px-4 py-2 font-semibold text-white"
        >
          Nouvelle fiche
        </Link>

        <a
          href="/api/export/fiche1"
          className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white"
        >
          Export Excel
        </a>
      </div>

      {fichesError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Erreur lors du chargement des fiches : {fichesError.message}
        </div>
      ) : (
        <div className="space-y-4">
          {fiches?.length ? (
            fiches.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    Fiche {f.numero_fiche || "(sans numéro)"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Année {f.annee ?? "-"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Responsable : {f.responsable_nom || "-"}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={f.statut} />

                  <Link
                    href={`/dashboard/fiche1/${f.id}`}
                    className="rounded-lg border px-3 py-2 text-sm font-medium"
                  >
                    Voir
                  </Link>

                  {f.statut === "brouillon" ? (
                    <>
                      <Link
                        href={`/dashboard/fiche1/${f.id}/edit`}
                        className="rounded-lg border px-3 py-2 text-sm font-medium"
                      >
                        Modifier
                      </Link>

                      <SubmitDraftButton ficheId={f.id} />
                    </>
                  ) : null}

                  <a
                    href={`/api/pdf/fiche1/${f.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
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
      )}

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/dashboard/fiche1?page=${Math.max(1, page - 1)}`}
          className={`rounded-lg border px-4 py-2 ${
            page <= 1 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Précédent
        </Link>

        <div className="text-sm text-gray-500">
          Page {page} / {totalPages}
        </div>

        <Link
          href={`/dashboard/fiche1?page=${Math.min(totalPages, page + 1)}`}
          className={`rounded-lg border px-4 py-2 ${
            page >= totalPages ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Suivant
        </Link>
      </div>
    </AppShell>
  );
}
