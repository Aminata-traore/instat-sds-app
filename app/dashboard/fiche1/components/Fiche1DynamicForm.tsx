"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Question = {
  code: string;
  label: string;
  section: string;
  order_index: number;
  field_type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "multiselect"
    | "yesno"
    | "checkbox"
    | "radio";
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  ref_table: string | null;
  ref_value_field: string | null;
  ref_label_field: string | null;
  static_options: any | null; // JSONB
  display_rules: any | null; // JSONB (optionnel pour plus tard)
};

type RefOption = { value: string | number; label: string };

type AnswerState = {
  // stocke une valeur simple ou array selon type
  [question_code: string]: any;
};

function sectionTitle(section: string) {
  // simple mapping (tu peux améliorer)
  if (section === "section1") return "Section 1 — Identification";
  if (section === "section2") return "Section 2 — Caractéristiques";
  if (section === "section3") return "Section 3 — Réalisation / Exécution";
  if (section === "section4") return "Section 4 — Financement";
  if (section === "section5") return "Section 5 — Informations de remplissage";
  return section;
}

export default function Fiche1DynamicForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});

  // options cache: key = `${ref_table}|${filterKey}`
  const [optionsCache, setOptionsCache] = useState<Record<string, RefOption[]>>(
    {}
  );

  // IMPORTANT: Région (1.01) influence Cercles (1.02)
  const selectedRegionId = answers["1.01"]; // on stocke l'id de la région

  const sections = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of questions) {
      const arr = map.get(q.section) ?? [];
      arr.push(q);
      map.set(q.section, arr);
    }
    // tri interne
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("fiche1_questions")
        .select(
          "code,label,section,order_index,field_type,placeholder,help_text,is_required,ref_table,ref_value_field,ref_label_field,static_options,display_rules"
        )
        .order("section", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) {
        console.error(error);
        alert("Erreur chargement questions (fiche1_questions).");
        setLoading(false);
        return;
      }

      setQuestions((data as Question[]) ?? []);
      setLoading(false);
    };

    loadQuestions();
  }, []);

  // Charge options d'une question (ref_table ou static_options)
  const getOptions = async (q: Question): Promise<RefOption[]> => {
    // static_options
    if (q.static_options && Array.isArray(q.static_options)) {
      return q.static_options.map((x: any) => ({
        value: x?.value ?? x,
        label: x?.label ?? String(x),
      }));
    }

    if (!q.ref_table) return [];

    const valueField = q.ref_value_field || "id";
    const labelField = q.ref_label_field || "label";

    // filtre spécial pour cercles: dépend de 1.01
    let cacheKey = q.ref_table;

    if (q.code === "1.02") {
      cacheKey = `${q.ref_table}|region=${selectedRegionId || "none"}`;
      // si pas de région sélectionnée => pas d'options
      if (!selectedRegionId) return [];
    }

    // cache hit
    if (optionsCache[cacheKey]) return optionsCache[cacheKey];

    // construire requête
    let query = supabase.from(q.ref_table).select(`${valueField},${labelField}`);

    if (q.code === "1.02") {
      query = query.eq("region_id", selectedRegionId);
    }

    // tri (si labelField)
    query = query.order(labelField as any, { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return [];
    }

    const opts: RefOption[] = (data ?? []).map((row: any) => ({
      value: row[valueField],
      label: String(row[labelField]),
    }));

    setOptionsCache((prev) => ({ ...prev, [cacheKey]: opts }));
    return opts;
  };

  // prefetch options pour select/multiselect quand région change ou questions chargées
  useEffect(() => {
    const prefetch = async () => {
      if (!questions.length) return;

      // On précharge seulement les selects visibles; c’est ok de garder simple
      for (const q of questions) {
        if (q.field_type === "select" || q.field_type === "multiselect") {
          // pour 1.02, on attend région
          if (q.code === "1.02" && !selectedRegionId) continue;
          await getOptions(q);
        }
      }
    };
    prefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, selectedRegionId]);

  const setAnswer = (code: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));

    // Si l’agent change Région => reset Cercle
    if (code === "1.01") {
      setAnswers((prev) => ({ ...prev, ["1.01"]: value, ["1.02"]: "" }));
    }
  };

  // Convertit state => lignes answers_fiche1
  const buildAnswerRows = (fiche1Id: string) => {
    const rows: any[] = [];

    for (const q of questions) {
      const v = answers[q.code];

      // on n’enregistre rien si vide (tu peux changer: enregistrer null)
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;

      const row: any = {
        fiche1_id: fiche1Id,
        question_code: q.code,
        value_text: null,
        value_number: null,
        value_bool: null,
        value_json: null,
      };

      if (q.field_type === "number") row.value_number = Number(v);
      else if (q.field_type === "yesno" || q.field_type === "checkbox")
        row.value_bool = Boolean(v);
      else if (q.field_type === "multiselect") row.value_json = v; // array
      else row.value_text = String(v);

      rows.push(row);
    }

    return rows;
  };

  const createFiche1AndSave = async () => {
    try {
      setSaving(true);

      // 1) créer une fiche1 minimale (header)
      // IMPORTANT: adapte les champs si ta table fiche1 a d’autres colonnes not null
      const { data: ficheData, error: ficheErr } = await supabase
        .from("fiche1")
        .insert([
          {
            // tu peux ajouter: year, numero, statut...
            statut: "brouillon",
          },
        ])
        .select("id")
        .single();

      if (ficheErr) {
        console.error(ficheErr);
        alert(
          "Erreur création fiche1. Vérifie les colonnes obligatoires de la table fiche1."
        );
        return;
      }

      const fiche1Id = ficheData.id as string;

      // 2) upsert les réponses
      const rows = buildAnswerRows(fiche1Id);

      const { error: ansErr } = await supabase
        .from("answers_fiche1")
        .upsert(rows, { onConflict: "fiche1_id,question_code" });

      if (ansErr) {
        console.error(ansErr);
        alert(
          "Erreur sauvegarde answers_fiche1. Vérifie colonnes fiche1_id/question_code et contrainte unique."
        );
        return;
      }

      alert("✅ Fiche 1 enregistrée (brouillon).");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (q: Question) => {
    const value = answers[q.code] ?? (q.field_type === "multiselect" ? [] : "");

    // YES/NO simple
    if (q.field_type === "yesno") {
      const boolVal =
        value === true || value === "true" ? true : value === false ? false : "";
      return (
        <div className="flex gap-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={q.code}
              checked={boolVal === true}
              onChange={() => setAnswer(q.code, true)}
            />
            Oui
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={q.code}
              checked={boolVal === false}
              onChange={() => setAnswer(q.code, false)}
            />
            Non
          </label>
        </div>
      );
    }

    if (q.field_type === "text" || q.field_type === "date" || q.field_type === "number") {
      return (
        <input
          type={q.field_type === "text" ? "text" : q.field_type}
          className="w-full border rounded px-3 py-2"
          placeholder={q.placeholder ?? ""}
          value={value}
          onChange={(e) => setAnswer(q.code, e.target.value)}
        />
      );
    }

    if (q.field_type === "textarea") {
      return (
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder={q.placeholder ?? ""}
          value={value}
          onChange={(e) => setAnswer(q.code, e.target.value)}
        />
      );
    }

    if (q.field_type === "select") {
      const cacheKey =
        q.code === "1.02"
          ? `${q.ref_table}|region=${selectedRegionId || "none"}`
          : q.ref_table || "";

      const opts = (cacheKey && optionsCache[cacheKey]) || [];

      return (
        <select
          className="w-full border rounded px-3 py-2"
          value={value}
          disabled={q.code === "1.02" && !selectedRegionId}
          onChange={(e) => setAnswer(q.code, e.target.value)}
        >
          <option value="">
            {q.code === "1.02" && !selectedRegionId
              ? "Choisis d’abord la région"
              : "-- Choisir --"}
          </option>
          {opts.map((o) => (
            <option key={`${o.value}`} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (q.field_type === "multiselect") {
      const cacheKey = q.ref_table || q.code;
      const opts = (optionsCache[cacheKey] || []) as RefOption[];

      // fallback: si pas d’options, on laisse un champ texte JSON (rare)
      if (!opts.length) {
        return (
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder='Ex: ["valeur1","valeur2"]'
            value={Array.isArray(value) ? JSON.stringify(value) : ""}
            onChange={(e) => {
              try {
                setAnswer(q.code, JSON.parse(e.target.value || "[]"));
              } catch {
                // ignore parse error
              }
            }}
          />
        );
      }

      const arr: any[] = Array.isArray(value) ? value : [];

      return (
        <div className="border rounded p-2 space-y-2">
          {opts.map((o) => {
            const checked = arr.includes(o.value) || arr.includes(String(o.value));
            return (
              <label key={`${o.value}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAnswer(q.code, [...arr, o.value]);
                    } else {
                      setAnswer(
                        q.code,
                        arr.filter(
                          (x) => String(x) !== String(o.value)
                        )
                      );
                    }
                  }}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <div className="text-sm text-red-600">
        Champ non supporté: {q.field_type}
      </div>
    );
  };

  if (loading) return <div className="p-4">Chargement du formulaire…</div>;

  return (
    <div className="space-y-6">
      {sections.map(([sectionKey, qs]) => (
        <div key={sectionKey} className="border rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">{sectionTitle(sectionKey)}</h2>

          <div className="grid gap-4">
            {qs.map((q) => (
              <div key={q.code} className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <label className="font-medium">
                    {q.code} — {q.label}
                    {q.is_required ? <span className="text-red-600"> *</span> : null}
                  </label>
                </div>

                {q.help_text ? (
                  <p className="text-xs text-gray-600">{q.help_text}</p>
                ) : null}

                {renderField(q)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
          disabled={saving}
          onClick={createFiche1AndSave}
        >
          {saving ? "Enregistrement…" : "Enregistrer (brouillon)"}
        </button>
      </div>
    </div>
  );
}
