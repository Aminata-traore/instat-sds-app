"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type ValidationStatus = "valide" | "rejete";

type Fiche1Row = {
  id: string;
  statut?: string | null; // "brouillon" | "soumis" | "valide" | "rejete"
  status?: string | null; // au cas où ta colonne s'appelle status
  created_by?: string | null;
  created_at?: string | null;
};

type Question = {
  code: string;
  label: string;
  section: string;
  order_index: number;
  field_type: string;
};

type Answer = {
  question_code: string;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_json: any | null;
};

function sectionTitle(section: string) {
  if (section === "section1") return "Section 1 — Identification";
  if (section === "section2") return "Section 2 — Caractéristiques";
  if (section === "section3") return "Section 3 — Réalisation / Exécution";
  if (section === "section4") return "Section 4 — Financement";
  if (section === "section5") return "Section 5 — Informations de remplissage";
  return section;
}

function formatAnswer(q: Question, a?: Answer) {
  if (!a) return "-";

  // priorité par type
  if (q.field_type === "yesno" || q.field_type === "checkbox") {
    if (a.value_bool === null) return "-";
    return a.value_bool ? "Oui" : "Non";
  }

  if (q.field_type === "number") {
    return a.value_number ?? "-";
  }

  if (q.field_type === "multiselect") {
    if (!a.value_json) return "-";
    try {
      if (Array.isArray(a.value_json)) return a.value_json.join(", ");
      return JSON.stringify(a.value_json);
    } catch {
      return String(a.value_json);
    }
  }

  // text/date/select/etc.
  return a.value_text ?? "-";
}

export default function AdminFiche1DetailPage() {
  const { loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const [role, setRole] = useState<string | null>(null);
  const [fiche, setFiche] = useState<Fiche1Row | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);

      try {
        // 1) user + role
        const { data: u, error: eUser } = await supabase.auth.getUser();
        if (eUser) throw new Error(eUser.message);

        const uid = u.user?.id;
        if (!uid) throw new Error("Utilisateur non connecté");

        const { data: prof, error: eProf } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();

        if (eProf) throw new Error(eProf.message);

        const r = (prof?.role ?? "agent") as string;
        if (!alive) return;
        setRole(r);

        if (!["admin", "validateur"].includes(r)) {
          setError("Accès refusé : vous n’êtes pas validateur/admin.");
          return;
        }

        // 2) charger fiche1 (entête)
        const { data: f, error: eF } = await supabase
          .from("fiche1")
          .select("id, statut, status, created_by, created_at")
          .eq("id", id)
          .single();

        if (!alive) return;
        if (eF) throw new Error(eF.message);
        setFiche(f as Fiche1Row);

        // 3) charger questions (pour afficher par section)
        const { data: qs, error: eQ } = await supabase
          .from("fiche1_questions")
          .select("code,label,section,order_index,field_type")
          .order("section", { ascending: true })
          .order("order_index", { ascending: true });

        if (!alive) return;
        if (eQ) throw new Error(eQ.message);
        setQuestions((qs ?? []) as Question[]);

        // 4) charger réponses
        const { data: ans, error: eA } = await supabase
          .from("answers_fiche1")
          .select("question_code,value_text,value_number,value_bool,value_json")
          .eq("fiche1_id", id);

        if (!alive) return;
        if (eA) throw new Error(eA.message);

        const map: Record<string, Answer> = {};
        for (const row of ans ?? []) {
          map[(row as any).question_code] = row as any;
        }
        setAnswers(map);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Erreur inconnue");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const grouped = useMemo(() => {
    const m = new Map<string, Question[]>();
    for (const q of questions) {
      const arr = m.get(q.section) ?? [];
      arr.push(q);
      m.set(q.section, arr);
    }
    return Array.from(m.entries());
  }, [questions]);

  const currentStatus =
    fiche?.statut ?? fiche?.status ?? "-";

  const setStatus = async (statut: ValidationStatus) => {
    setError(null);
    setBusy(true);

    try {
      const { data: u, error: eUser } = await supabase.auth.getUser();
      if (eUser) throw new Error(eUser.message);

      const uid = u.user?.id;
      if (!uid) throw new Error("Utilisateur non connecté");

      // On met à jour statut OU status selon ce qui existe
      // (si ta colonne est 'statut', status sera ignorée, et inversement)
      const payload: any = { statut };
      // si ta table utilise "status" au lieu de "statut", remplace par { status: statut }
      // ou garde les deux (le champ inexistant sera rejeté) => donc on fait 2 tentatives.

      // tentative 1: statut
      let { error: eUpd } = await supabase
        .from("fiche1")
        .update({ statut })
        .eq("id", id);

      // si erreur colonne statut, tentative 2 : status
      if (eUpd && String(eUpd.message).toLowerCase().includes("column")) {
        const r2 = await supabase
          .from("fiche1")
          .update({ status: statut })
          .eq("id", id);
        eUpd = r2.error ?? null;
      }

      if (eUpd) throw new Error(eUpd.message);

      // (Optionnel plus tard) enregistrer le commentaire dans une table fiche1_validations
      // Pour l’instant on ne le persiste pas.

      router.push("/admin");
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <main className="p-6 max-w-5xl">
      <h1 className="text-2xl font-extrabold">Validation — Fiche 1</h1>
      <p className="mt-2 text-sm text-neutral-600">Rôle : {role ?? "-"}</p>

      {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}

      {!fiche ? (
        <p className="mt-4">Chargement fiche…</p>
      ) : (
        <>
          {/* ENTETE */}
          <div className="mt-4 rounded-xl border bg-white p-4 space-y-1">
            <h2 className="text-lg font-bold">Résumé</h2>
            <p>Date: {fiche.created_at ? new Date(fiche.created_at).toLocaleString() : "-"}</p>
            <p>ID fiche: {fiche.id}</p>
            <p>Créée par: {fiche.created_by ?? "-"}</p>
            <p>Statut: {String(currentStatus)}</p>
          </div>

          {/* REPONSES */}
          <div className="mt-4 space-y-4">
            {grouped.map(([section, qs]) => (
              <div key={section} className="rounded-xl border bg-white p-4">
                <h2 className="text-lg font-bold">{sectionTitle(section)}</h2>

                <div className="mt-3 grid gap-2">
                  {qs.map((q) => (
                    <div
                      key={q.code}
                      className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-2 border-b last:border-b-0 py-2"
                    >
                      <div className="text-sm font-semibold">
                        {q.code} — {q.label}
                      </div>
                      <div className="text-sm text-neutral-800">
                        {formatAnswer(q, answers[q.code])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* COMMENTAIRE (non persisté pour l’instant) */}
          <div className="mt-4">
            <label className="font-bold">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 w-full h-24 border rounded-lg p-3"
              placeholder="Ex: champ manquant, incohérence, correction…"
            />
            <p className="mt-1 text-xs text-neutral-500">
              (Pour enregistrer ce commentaire, on ajoutera une table dédiée aux validations.)
            </p>
          </div>

          {/* ACTIONS */}
          <div className="mt-4 flex gap-3">
            <button
              disabled={busy}
              onClick={() => setStatus("valide")}
              className="px-4 py-2 rounded-lg border bg-white font-bold"
            >
              {busy ? "..." : "✅ Valider"}
            </button>

            <button
              disabled={busy}
              onClick={() => setStatus("rejete")}
              className="px-4 py-2 rounded-lg border bg-white font-bold"
            >
              {busy ? "..." : "❌ Rejeter"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
