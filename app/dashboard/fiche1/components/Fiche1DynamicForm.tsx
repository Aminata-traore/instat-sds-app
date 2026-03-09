"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  static_options: any | null;
};

type RefOption = { value: string | number; label: string };
type AnswerState = Record<string, any>;

function sectionTitle(section: string) {
  if (section === "section1") return "Section 1 — Identification";
  if (section === "section2") return "Section 2 — Caractéristiques";
  if (section === "section3") return "Section 3 — Réalisation / Exécution";
  if (section === "section4") return "Section 4 — Financement";
  if (section === "section5") return "Section 5 — Informations de remplissage";
  return section;
}

function toBool(v: any): boolean {
  if (v === true) return true;
  if (v === false) return false;

  const s = String(v ?? "").trim().toLowerCase();

  if (["true", "oui", "yes", "1"].includes(s)) return true;
  if (["false", "non", "no", "0"].includes(s)) return false;

  return Boolean(v);
}

function smartCastSelectValue(raw: string) {
  if (raw === "") return "";

  const n = Number(raw);

  return Number.isFinite(n) && String(n) === raw ? n : raw;
}

function isFreeTextFallback(code: string) {
  return ["2.02", "2.03", "3.02", "3.05", "3.08"].includes(code);
}

export default function Fiche1DynamicForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [optionsCache, setOptionsCache] = useState<Record<string, RefOption[]>>(
    {}
  );

  const selectedRegionId = answers["1.01"] || "";
  const selectedCercleId = answers["1.02"] || "";

  const sections = useMemo(() => {
    const map = new Map<string, Question[]>();

    for (const q of questions) {
      const arr = map.get(q.section) ?? [];
      arr.push(q);
      map.set(q.section, arr);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      map.set(k, arr);
    }

    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("fiche1_questions")
        .select(
          "code,label,section,order_index,field_type,placeholder,help_text,is_required,ref_table,ref_value_field,ref_label_field,static_options"
        )
        .order("section")
        .order("order_index");

      if (error) {
        console.error(error);
        alert("Erreur chargement questions.");
        return;
      }

      setQuestions(data ?? []);
      setLoading(false);
    })();
  }, []);

  const getOptions = async (q: Question): Promise<RefOption[]> => {
    if (q.static_options) {
      return q.static_options.map((x: any) => ({
        value: x.value ?? x,
        label: x.label ?? String(x),
      }));
    }

    if (!q.ref_table) return [];

    const valueField = q.ref_value_field || "id";
    const labelField = q.ref_label_field || "label";

    let cacheKey = q.ref_table;

    if (q.code === "1.02") {
      cacheKey = `${q.ref_table}|region=${selectedRegionId}`;

      if (!selectedRegionId) return [];
    }

    if (q.code === "1.03") {
      cacheKey = `${q.ref_table}|cercle=${selectedCercleId}`;

      if (!selectedCercleId) return [];
    }

    if (optionsCache[cacheKey]) return optionsCache[cacheKey];

    let query = supabase.from(q.ref_table).select(`${valueField},${labelField}`);

    if (q.code === "1.02") {
      query = query.eq("region_id", selectedRegionId);
    }

    if (q.code === "1.03") {
      query = query.eq("cercle_id", selectedCercleId);
    }

    const { data, error } = await query.order(labelField);

    if (error) {
      console.error(error);
      return [];
    }

    const opts = (data ?? []).map((row: any) => ({
      value: row[valueField],
      label: row[labelField],
    }));

    setOptionsCache((prev) => ({ ...prev, [cacheKey]: opts }));

    return opts;
  };

  useEffect(() => {
    (async () => {
      for (const q of questions) {
        if (q.field_type === "select" || q.field_type === "multiselect") {
          await getOptions(q);
        }
      }
    })();
  }, [questions, selectedRegionId, selectedCercleId]);

  const setAnswer = (code: string, value: any) => {
    if (code === "1.01") {
      setAnswers((prev) => ({
        ...prev,
        ["1.01"]: value,
        ["1.02"]: "",
        ["1.03"]: "",
      }));
      return;
    }

    if (code === "1.02") {
      setAnswers((prev) => ({
        ...prev,
        ["1.02"]: value,
        ["1.03"]: "",
      }));
      return;
    }

    setAnswers((prev) => ({ ...prev, [code]: value }));
  };

  const buildAnswerRows = (fiche1Id: string) => {
    const rows: any[] = [];

    for (const q of questions) {
      const v = answers[q.code];

      if (!v) continue;

      const row: any = {
        fiche1_id: fiche1Id,
        question_code: q.code,
        value_text: null,
        value_number: null,
        value_bool: null,
        value_json: null,
      };

      if (q.field_type === "number") row.value_number = Number(v);
      else if (q.field_type === "yesno") row.value_bool = toBool(v);
      else if (q.field_type === "multiselect" && !isFreeTextFallback(q.code))
        row.value_json = v;
      else row.value_text = String(v);

      rows.push(row);
    }

    return rows;
  };

  const createFiche = async (statut: "brouillon" | "soumis") => {
    const { data: u } = await supabase.auth.getUser();

    const uid = u.user?.id;

    const payload = {
      region_id: answers["1.01"],
      cercle_id: answers["1.02"],
      structure_id: answers["1.03"],
      responsable_nom: answers["1.04"],
      annee: Number(answers["1.05"]),
      numero_fiche: answers["1.06"],
      statut,
      created_by: uid,
    };

    const { data, error } = await supabase
      .from("fiche1")
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      console.error(error);
      throw new Error("Erreur création fiche1");
    }

    return data.id;
  };

  const saveFiche = async (mode: "brouillon" | "soumis") => {
    setSaving(true);

    try {
      const fiche1Id = await createFiche(mode);

      const rows = buildAnswerRows(fiche1Id);

      const { error } = await supabase
        .from("answers_fiche1")
        .upsert(rows, { onConflict: "fiche1_id,question_code" });

      if (error) throw error;

      alert(
        mode === "soumis"
          ? "Fiche soumise pour validation"
          : "Brouillon enregistré"
      );

      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Chargement…</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="px-4 py-2 border rounded"
      >
        Retour
      </button>

      {sections.map(([sectionKey, qs]) => (
        <div key={sectionKey} className="border p-4 rounded-xl space-y-4">
          <h2 className="font-semibold text-lg">
            {sectionTitle(sectionKey)}
          </h2>

          {qs.map((q) => {
            const value = answers[q.code] ?? "";

            return (
              <div key={q.code} className="space-y-1">
                <label>
                  {q.code} — {q.label}
                </label>

                {renderField(q)}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={() => saveFiche("brouillon")}
          className="px-4 py-2 border rounded"
        >
          Enregistrer brouillon
        </button>

        <button
          onClick={() => saveFiche("soumis")}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Soumettre
        </button>
      </div>
    </div>
  );
}
