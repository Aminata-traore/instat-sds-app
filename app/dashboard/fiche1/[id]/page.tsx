export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import SubmitDraftButton from "../SubmitDraftButton";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function FichePage({ params }: PageProps) {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
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

  const { data: fiche, error: ficheError } = await supabase
    .from("fiche1")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (ficheError) {
    console.error("Erreur chargement fiche:", ficheError);
    redirect("/dashboard/fiche1");
  }

  if (!fiche) {
    redirect("/dashboard/fiche1");
  }

  // Agent : ne peut voir que ses propres fiches
  if (profile.role === "agent" && fiche.created_by !== session.user.id) {
    redirect("/dashboard/fiche1");
  }

  const { data: answers, error: answersError } = await supabase
    .from("answers_fiche1")
    .select("*")
    .eq("fiche1_id", params.id)
    .order("question_code", { ascending: true });

  if (answersError) {
    console.error("Erreur chargement réponses:", answersError);
  }

  return (
    <AppShell title="Consultation fiche">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/fiche1"
            className="rounded-xl border px-4 py-2 font-medium"
          >
            Retour
          </Link>

          {profile.role === "agent" && fiche.statut === "brouillon" ? (
            <>
              <Link
                href={`/dashboard/fiche1/${fiche.id}/edit`}
                className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
              >
                Modifier
              </Link>

              <SubmitDraftButton ficheId={fiche.id} />
            </>
          ) : null}

          <a
            href={`/api/pdf/fiche1/${fiche.id}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
          >
            Télécharger PDF
          </a>
        </div>

        <div className="rounded-xl border bg-white p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold">
                Fiche {fiche.numero_fiche || "(sans numéro)"}
              </div>

              <div className="text-sm text-gray-500">
                Année {fiche.annee ?? "-"}
              </div>

              <div className="text-sm text-gray-500">
                Responsable : {fiche.responsable_nom || "-"}
              </div>
            </div>

            <StatusBadge status={fiche.statut} />
          </div>

          <div className="space-y-3">
            {answers?.length ? (
              answers.map((a: any) => {
                let value: string = "-";

                if (a.value_text !== null && a.value_text !== undefined) {
                  value = String(a.value_text);
                } else if (
                  a.value_number !== null &&
                  a.value_number !== undefined
                ) {
                  value = String(a.value_number);
                } else if (a.value_bool !== null && a.value_bool !== undefined) {
                  value = a.value_bool ? "Oui" : "Non";
                } else if (a.value_json !== null && a.value_json !== undefined) {
                  value = Array.isArray(a.value_json)
                    ? a.value_json.join(", ")
                    : JSON.stringify(a.value_json);
                }

                return (
                  <div
                    key={a.id}
                    className="rounded border bg-gray-50 p-3"
                  >
                    <div className="text-sm font-semibold">{a.question_code}</div>

                    <div className="text-sm text-gray-700">{value}</div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                Aucune réponse enregistrée pour cette fiche.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
