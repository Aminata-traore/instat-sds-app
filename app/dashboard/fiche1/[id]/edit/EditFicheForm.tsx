"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Fiche = {
  id: string;
  region_id: number | null;
  cercle_id: number | null;
  structure_id: number | null;
  responsable_nom: string | null;
  annee: number | null;
  numero_fiche: string | null;
  statut: string;
};

type AnswerRow = {
  question_code: string;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_json: any | null;
};

export default function EditFicheForm({
  fiche,
  answers,
}: {
  fiche: Fiche;
  answers: AnswerRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const answerMap = useMemo(() => {
    const map: Record<string, any> = {
      "1.01": fiche.region_id ?? "",
      "1.02": fiche.cercle_id ?? "",
      "1.03": fiche.structure_id ?? "",
      "1.04": fiche.responsable_nom ?? "",
      "1.05": fiche.annee ?? "",
      "1.06": fiche.numero_fiche ?? "",
    };

    for (const a of answers) {
      if (a.value_text !== null) map[a.question_code] = a.value_text;
      else if (a.value_number !== null) map[a.question_code] = a.value_number;
      else if (a.value_bool !== null) map[a.question_code] = a.value_bool;
      else if (a.value_json !== null) map[a.question_code] = a.value_json;
    }

    return map;
  }, [fiche, answers]);

  const save = async (submitNow: boolean) => {
    setSaving(true);

    try {
      const { error: ficheErr } = await supabase
        .from("fiche1")
        .update({
          statut: submitNow ? "soumis" : "brouillon",
        })
        .eq("id", fiche.id);

      if (ficheErr) throw new Error(ficheErr.message);

      await supabase.from("validation_history").insert([
        {
          fiche_id: fiche.id,
          action: submitNow ? "soumis" : "brouillon_modifie",
          user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
          comment: null,
        },
      ]);

      alert(submitNow ? "✅ Fiche modifiée et soumise." : "✅ Brouillon modifié.");
      router.push(`/dashboard/fiche1/${fiche.id}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="text-sm text-neutral-600">
        Cette page est prête pour l’édition d’un brouillon. Les valeurs déjà enregistrées sont chargées.
      </div>

      <pre className="overflow-auto rounded-xl bg-neutral-50 p-4 text-xs">
        {JSON.stringify(answerMap, null, 2)}
      </pre>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => save(false)}
          className="rounded-xl border px-4 py-2 font-semibold"
        >
          {saving ? "Sauvegarde..." : "Enregistrer brouillon"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => save(true)}
          className="rounded-xl bg-black px-4 py-2 font-semibold text-white"
        >
          {saving ? "Soumission..." : "Soumettre"}
        </button>
      </div>
    </div>
  );
}
