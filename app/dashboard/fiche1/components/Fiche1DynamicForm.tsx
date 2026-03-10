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

const AUTOSAVE_KEY = "fiche1_autosave";

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
  const [lastSavedAt, setLastSavedAt] = useState<string>("");

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

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    const required = questions.filter((q) => q.is_required);
    if (!required.length) return 0;

    const filled = required.filter((q) => {
      const v = answers[q.code];
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });

    return Math.round((filled.length / required.length) * 100);
  }, [questions, answers]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("fiche1_questions")
        .select(
          "code,label,section,order_index,field_type,placeholder,help_text,is_required,ref_table,ref_value_field,ref_label_field,static_options"
        )
        .order("section", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) {
        console.error(error);
        alert("Erreur chargement questions.");
        setLoading(false);
        return;
      }

      setQuestions((data as Question[]) ?? []);

      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AUTOSAVE_KEY)
          : null;

      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch {
          //
        }
      }

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!questions.length) return;

    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(answers));
        setLastSavedAt(new Date().toLocaleTimeString("fr-FR"));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [answers, questions]);

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

    if (q.code === "1.03") {
      cacheKey = `${q.ref_table}|cercle=${selectedCercleId || "none"}`;
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

  const validateBeforeSubmit = () => {
    const requiredQuestions = questions.filter((q) => q.is_required);

    for (const q of requiredQuestions) {
      const v = answers[q.code];

      if (v === undefined || v === null || v === "") {
        throw new Error(`Le champ ${q.code} — ${q.label} est obligatoire.`);
      }

      if (Array.isArray(v) && v.length === 0) {
        throw new Error(`Le champ ${q.code} — ${q.label} est obligatoire.`);
      }
    }
  };

  const createFiche = async (statut: "brouillon" | "soumis") => {
    const { data: u, error: userErr } = await supabase.auth.getUser();

    if (userErr) throw new Error(userErr.message);

    const uid = u.user?.id ?? null;

    const payload = {
      region_id: answers["1.01"],
      cercle_id: answers["1.02"],
      structure_id: answers["1.03"],
      responsable_nom: String(answers["1.04"] || ""),
      annee: Number(answers["1.05"]),
      numero_fiche: String(answers["1.06"] || ""),
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
      throw new Error(error.message || "Erreur création fiche1");
    }

    return { ficheId: String(data.id), uid };
  };

  const saveHistory = async (
    ficheId: string,
    uid: string | null,
    action: string,
    comment?: string
  ) => {
    await supabase.from("validation_history").insert([
      {
        fiche_id: ficheId,
        action,
        comment: comment || null,
        user_id: uid,
      },
    ]);

    await supabase.from("system_logs").insert([
      {
        module: "fiche1",
        action,
        target_id: ficheId,
        actor_id: uid,
        metadata: { source: "formulaire_fiche1" },
      },
    ]);
  };

  const saveFiche = async (mode: "brouillon" | "soumis") => {
    setSaving(true);

    try {
      if (mode === "soumis") {
        validateBeforeSubmit();
      }

      const { ficheId, uid } = await createFiche(mode);
      const rows = buildAnswerRows(ficheId);

      const { error: ansErr } = await supabase
        .from("answers_fiche1")
        .upsert(rows, { onConflict: "fiche1_id,question_code" });

      if (ansErr) {
        throw new Error(
          "Erreur sauvegarde answers_fiche1. Vérifie la contrainte unique fiche1_id,question_code."
        );
      }

      await saveHistory(
        ficheId,
        uid,
        mode === "soumis" ? "soumis" : "brouillon_enregistre"
      );

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTOSAVE_KEY);
      }

      alert(
        mode === "soumis"
          ? "✅ Fiche 1 soumise pour validation."
          : "✅ Fiche 1 enregistrée en brouillon."
      );

      setAnswers({});
      router.push("/dashboard/fiche1");
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
          : q.code === "1.03"
          ? `${q.ref_table}|cercle=${selectedCercleId || "none"}`
          : q.ref_table || "";

      const opts = (cacheKey && optionsCache[cacheKey]) || [];

      return (
        <select
          className="w-full border rounded px-3 py-2"
          value={value}
          disabled={
            (q.code === "1.02" && !selectedRegionId) ||
            (q.code === "1.03" && !selectedCercleId)
          }
          onChange={(e) => setAnswer(q.code, smartCastSelectValue(e.target.value))}
        >
          <option value="">
            {q.code === "1.02" && !selectedRegionId
              ? "Choisis d’abord la région"
              : q.code === "1.03" && !selectedCercleId
              ? "Choisis d’abord le cercle"
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

    return <div className="text-sm text-red-600">Champ non supporté</div>;
  };

  if (loading) return <div className="p-6">Chargement du formulaire…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded border bg-white font-semibold"
          >
            Retour
          </button>

          <div className="text-sm text-neutral-500">
            Progression : {progress}%
            {lastSavedAt ? ` • autosave ${lastSavedAt}` : ""}
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {sections.map(([sectionKey, qs]) => (
        <div key={sectionKey} className="border rounded-xl p-4 space-y-4 bg-white">
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
