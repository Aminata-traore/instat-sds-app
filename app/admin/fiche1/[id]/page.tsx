"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/app/_components/AppShell";
import { DocumentActions } from "@/components/DocumentActions";
import { StatusBadge } from "@/components/StatusBadge";

type Fiche = {
  id: string;
  numero_fiche: string;
  annee: number;
  responsable_nom: string;
  statut: string;
};

type Answer = {
  id: string;
  question_code: string;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_json: any | null;
};

type HistoryRow = {
  id: string;
  action: string;
  comment: string | null;
  created_at: string;
};

export default function AdminFicheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ficheId = String(params.id);

  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ficheData } = await supabase
        .from("fiche1")
        .select("*")
        .eq("id", ficheId)
        .single();

      const { data: ansData } = await supabase
        .from("answers_fiche1")
        .select("*")
        .eq("fiche1_id", ficheId)
        .order("question_code", { ascending: true });

      const { data: historyData } = await supabase
        .from("validation_history")
        .select("*")
        .eq("fiche_id", ficheId)
        .order("created_at", { ascending: false });

      setFiche(ficheData);
      setAnswers(ansData ?? []);
      setHistory(historyData ?? []);
      setLoading(false);
    })();
  }, [ficheId]);

  const saveLog = async (action: string, comment?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("validation_history").insert([
      {
        fiche_id: ficheId,
        action,
        comment: comment || null,
        user_id: user?.id ?? null,
      },
    ]);

    await supabase.from("system_logs").insert([
      {
        module: "validation",
        action,
        target_id: ficheId,
        actor_id: user?.id ?? null,
        metadata: { comment: comment || null },
      },
    ]);
  };

  const updateStatus = async (status: "valide" | "rejete") => {
    setBusy(true);

    const payload: any = {
      statut: status,
      validated_at: new Date().toISOString(),
    };

    const {
      data: { user },
    } = await supabase.auth.getUser();

    payload.validated_by = user?.id ?? null;

    let motif: string | undefined;

    if (status === "rejete") {
      motif = prompt("Motif du rejet") || "";
      if (!motif) {
        setBusy(false);
        return;
      }
      payload.motif_rejet = motif;
    }

    const { error } = await supabase
      .from("fiche1")
      .update(payload)
      .eq("id", ficheId);

    if (error) {
      alert(error.message);
      setBusy(false);
      return;
    }

    await saveLog(status, motif);

    router.push("/admin");
  };

  if (loading) {
    return (
      <AppShell title="Validation fiche">
        <div>Chargement...</div>
      </AppShell>
    );
  }

  if (!fiche) {
    return (
      <AppShell title="Validation fiche">
        <div>Fiche introuvable.</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Validation fiche">
      <DocumentActions ficheId={fiche.id} />

      <div className="rounded-2xl border bg-white p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-bold">Fiche {fiche.numero_fiche}</div>
            <div className="text-sm text-gray-500">Année {fiche.annee}</div>
            <div className="text-sm text-gray-500">
              Responsable : {fiche.responsable_nom}
            </div>
          </div>

          <StatusBadge status={fiche.statut} />
        </div>

        <div className="space-y-3">
          {answers.map((a) => {
            const value =
              a.value_text ??
              a.value_number?.toString() ??
              a.value_bool?.toString() ??
              JSON.stringify(a.value_json ?? "");

            return (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 p-3 bg-gray-50"
              >
                <div className="text-sm font-semibold">{a.question_code}</div>
                <div className="text-sm text-gray-700">{value}</div>
              </div>
            );
          })}
        </div>

        {fiche.statut === "soumis" && (
          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={() => updateStatus("valide")}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
            >
              Accepter
            </button>

            <button
              disabled={busy}
              onClick={() => updateStatus("rejete")}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold"
            >
              Refuser
            </button>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Historique</h3>

          <div className="space-y-2">
            {history.length ? (
              history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{h.action}</div>
                  <div className="text-gray-500">
                    {new Date(h.created_at).toLocaleString("fr-FR")}
                  </div>
                  {h.comment ? <div>{h.comment}</div> : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">Aucun historique.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
