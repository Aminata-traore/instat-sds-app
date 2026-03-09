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
  display_rules: any | null;
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
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;

  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "oui" || s === "yes") return true;
  if (s === "false" || s === "non" || s === "no") return false;

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
      setLoading(true);

      const { data, error } = await supabase
        .from("fiche1_questions")
        .select(
          "code,label,section,order_index,field_type,placeholder,help_text,is_required,ref_table,ref_value_field,ref_label_field,static_options,display_rules"
        )
        .order("section", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Erreur chargement fiche1_questions:", error);
        alert("Erreur chargement questions (fiche1_questions).");
        setLoading(false);
        return;
      }

      setQuestions((data as Question[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const getOptions = async (q: Question): Promise<RefOption[]> => {
    if (q.static_options && Array.isArray(q.static_options)) {
      return q.static_options.map((x: any) => ({
        value: x?.value ?? x,
        label: x?.label ?? String(x),
      }));
    }

    if (!q.ref_table) return [];

    const valueField = q.ref_value_field || "id";
    const labelField = q.ref_label_field || "label";

    let cacheKey = q.ref_table;

    if (q.code === "1.02") {
      cacheKey = `${q.ref_table}|region=${selectedRegionId || "none"}`;
      if (!selectedRegionId) return [];
    }

    if (optionsCache[cacheKey]) return optionsCache[cacheKey];

    let query = supabase.from(q.ref_table).select(`${valueField},${labelField}`);

    if (q.code === "1.02") {
      query = query.eq("region_id", selectedRegionId);
    }

    query = query.order(labelField as any, { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error(`Erreur chargement options ${q.code}:`, error);
      return [];
    }

    const opts: RefOption[] = (data ?? []).map((row: any) => ({
      value: row[valueField],
      label: String(row[labelField]),
    }));

    setOptionsCache((prev) => ({ ...prev, [cacheKey]: opts }));
    return opts;
  };

  useEffect(() => {
    (async () => {
      if (!questions.length) return;

      for (const q of questions) {
        if (q.field_type === "select" || q.field_type === "multiselect") {
          if (q.code === "1.02" && !selectedRegionId) continue;
          await getOptions(q);
        }
      }
    })();
  }, [questions, selectedRegionId]);

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

      if (q.field_type === "number") {
        row.value_number = Number(v);
      } else if (q.field_type === "yesno" || q.field_type === "checkbox") {
        row.value_bool = toBool(v);
      } else if (q.field_type === "multiselect" && !isFreeTextFallback(q.code)) {
        row.value_json = v;
      } else {
        row.value_text = String(v);
      }

      rows.push(row);
    }

    return rows;
  };

  const createFiche = async (statut: "brouillon" | "soumis") => {
    const { data: u, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
      throw new Error(userErr.message);
    }

    const uid = u.user?.id ?? null;

    const region_id = answers["1.01"] || null;
    const cercle_id = answers["1.02"] || null;
    const structure_id = answers["1.03"] || null;
    const responsable_nom = answers["1.04"] || null;
    const anneeRaw = answers["1.05"] || null;
    const numero_fiche = answers["1.06"] || null;

    const annee =
      anneeRaw !== null && anneeRaw !== undefined && anneeRaw !== ""
        ? Number(anneeRaw)
        : null;

    if (!region_id) throw new Error("Le champ Région est obligatoire.");
    if (!cercle_id) throw new Error("Le champ Cercle est obligatoire.");
    if (!structure_id) throw new Error("Le champ Structure est obligatoire.");
    if (!responsable_nom) {
      throw new Error("Le champ Nom et prénom de la responsable est obligatoire.");
    }
    if (!annee || Number.isNaN(annee)) {
      throw new Error("Le champ Choix de l’année est obligatoire.");
    }
    if (!numero_fiche) {
      throw new Error("Le champ Numéro de la fiche est obligatoire.");
    }

    const payload = {
      region_id,
      cercle_id,
      structure_id,
      responsable_nom: String(responsable_nom),
      annee,
      numero_fiche: String(numero_fiche),
      statut,
      created_by: uid,
    };

    const { data, error } = await supabase
      .from("fiche1")
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      console.error("Erreur createFiche:", error, payload);
      throw new Error(
        error.message ||
          "Erreur création fiche1. Vérifie les colonnes obligatoires de la table fiche1."
      );
    }

    return String(data.id);
  };

  const saveFiche = async (mode: "brouillon" | "soumis") => {
    setSaving(true);

    try {
      const fiche1Id = await createFiche(mode);
      const rows = buildAnswerRows(fiche1Id);

      const { error: ansErr } = await supabase
        .from("answers_fiche1")
        .upsert(rows, { onConflict: "fiche1_id,question_code" });

      if (ansErr) {
        console.error("Erreur answers_fiche1:", ansErr);
        alert(
          "Erreur sauvegarde answers_fiche1. Vérifie la contrainte unique fiche1_id,question_code."
        );
        return;
      }

      alert(
        mode === "soumis"
          ? "✅ Fiche 1 soumise pour validation."
          : "✅ Fiche 1 enregistrée en brouillon."
      );

      setAnswers({});
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (q: Question) => {
    const value = answers[q.code] ?? (q.field_type === "multiselect" ? [] : "");

    if (q.field_type === "yesno") {
      const boolVal =
        value === true || value === "true"
          ? true
          : value === false || value === "false"
          ? false
          : "";

      return (
        <div className="flex gap-4">
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

    if (
      q.field_type === "text" ||
      q.field_type === "date" ||
      q.field_type === "number"
    ) {
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
          onChange={(e) => setAnswer(q.code, smartCastSelectValue(e.target.value))}
        >
          <option value="">
            {q.code === "1.02" && !selectedRegionId
              ? "Choisis d’abord la région"
              : "-- Choisir --"}
          </option>

          {opts.map((o) => (
            <option key={`${o.value}`} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (q.field_type === "multiselect") {
      const cacheKey = q.ref_table || q.code;
      const opts = (optionsCache[cacheKey] || []) as RefOption[];
      const arr: any[] = Array.isArray(value) ? value : [];

      if (!opts.length) {
        return (
          <textarea
            className="w-full border rounded px-3 py-2"
            placeholder="Saisir votre justification ici"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(q.code, e.target.value)}
          />
        );
      }

      return (
        <div className="border rounded p-3 space-y-2">
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
                        arr.filter((x) => String(x) !== String(o.value))
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

  if (loading) return <div className="p-6">Chargement du formulaire…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border bg-white font-semibold"
        >
          Retour
        </button>
      </div>

      {sections.map(([sectionKey, qs]) => (
        <div key={sectionKey} className="border rounded-xl p-4 space-y-4">
          <h2 className="text-lg font-semibold">{sectionTitle(sectionKey)}</h2>

          <div className="grid gap-4">
            {qs.map((q) => (
              <div key={q.code} className="space-y-1">
                <label className="font-medium">
                  {q.code} — {q.label}
                  {q.is_required ? <span className="text-red-600"> *</span> : null}
                </label>

                {q.help_text ? (
                  <p className="text-xs text-gray-600">{q.help_text}</p>
                ) : null}

                {renderField(q)}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded border bg-white font-semibold disabled:opacity-60"
          disabled={saving}
          onClick={() => saveFiche("brouillon")}
        >
          {saving ? "Enregistrement…" : "Enregistrer (brouillon)"}
        </button>

        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white font-semibold disabled:opacity-60"
          disabled={saving}
          onClick={() => saveFiche("soumis")}
        >
          {saving ? "Soumission…" : "Soumettre pour validation"}
        </button>
      </div>
    </div>
  );
}
