"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";
import { supabase } from "@/lib/supabase/client";

type Role = "admin" | "validateur" | "agent" | string;

type FicheRow = {
  id: string;
  created_at: string | null;
  statut: string | null;
  status?: string | null; // au cas où la colonne s'appelle status
  created_by?: string | null;
};

type AnswerRow = {
  fiche1_id: string;
  question_code: string;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_json: any | null;
};

type FicheListItem = {
  id: string;
  created_at: string | null;
  statut: string;

  // valeurs "lisibles" venant de answers_fiche1
  numero_fiche?: string;
  annee?: string;
  responsable?: string;
  region?: string;
  cercle?: string;
  structure?: string;
};

function pickAnswerValue(a?: AnswerRow) {
  if (!a) return undefined;
  if (a.value_text !== null && a.value_text !== undefined) return String(a.value_text);
  if (a.value_number !== null && a.value_number !== undefined) return String(a.value_number);
  if (a.value_bool !== null && a.value_bool !== undefined) return a.value_bool ? "Oui" : "Non";
  if (a.value_json !== null && a.value_json !== undefined) {
    try {
      return Array.isArray(a.value_json) ? a.value_json.join(", ") : JSON.stringify(a.value_json);
    } catch {
      return String(a.value_json);
    }
  }
  return undefined;
}

export function AdminFiche1Client() {
  const { loading } = useRequireAuth();

  const [role, setRole] = useState<Role>("agent");
  const [rows, setRows] = useState<FicheListItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canValidate = useMemo(
    () => ["admin", "validateur"].includes(String(role)),
    [role]
  );

  const load = async () => {
    setBusy(true);
    setErr(null);

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

      const r = (prof?.role ?? "agent") as Role;
      setRole(r);

      if (!["admin", "validateur"].includes(String(r))) {
        throw new Error("Accès refusé: vous n’êtes pas validateur/admin.");
      }

      // 2) charger fiches "soumis"
      // robuste: on essaie "statut", sinon on bascule sur "status"
      // NOTE: supabase renverra une erreur si la colonne n'existe pas dans select, donc on gère 2 requêtes.
      let ficheData: FicheRow[] = [];

      // tentative 1 : colonne "statut"
      const r1 = await supabase
        .from("fiche1")
        .select("id, created_at, statut, created_by")
        .in("statut", ["soumis"])
        .order("created_at", { ascending: false });

      if (!r1.error) {
        ficheData = (r1.data ?? []) as any;
      } else {
        // tentative 2 : colonne "status"
        const r2 = await supabase
          .from("fiche1")
          .select("id, created_at, status, created_by")
          .in("status", ["soumis"])
          .order("created_at", { ascending: false });

        if (r2.error) throw new Error(r2.error.message);
        ficheData = (r2.data ?? []).map((x: any) => ({
          id: x.id,
          created_at: x.created_at,
          statut: x.status ?? null,
          created_by: x.created_by ?? null,
        }));
      }

      const ficheIds = ficheData.map((f) => f.id);
      if (ficheIds.length === 0) {
        setRows([]);
        return;
      }

      // 3) récupérer les infos "lisibles" depuis answers_fiche1
      // codes utilisés dans notre formulaire:
      // 1.01 region, 1.02 cercle, 1.03 structure, 1.04 responsable, 1.05 annee, 1.06 numero fiche
      const neededCodes = ["1.01", "1.02", "1.03", "1.04", "1.05", "1.06"];

      const { data: ans, error: eAns } = await supabase
        .from("answers_fiche1")
        .select("fiche1_id, question_code, value_text, value_number, value_bool, value_json")
        .in("fiche1_id", ficheIds)
        .in("question_code", neededCodes);

      if (eAns) throw new Error(eAns.message);

      // index answers by fiche_id + question_code
      const byFiche: Record<string, Record<string, AnswerRow>> = {};
      for (const a of (ans ?? []) as any[]) {
        const fid = String(a.fiche1_id);
        byFiche[fid] = byFiche[fid] || {};
        byFiche[fid][String(a.question_code)] = a as AnswerRow;
      }

      const list: FicheListItem[] = ficheData.map((f) => {
        const a = byFiche[f.id] || {};
        return {
          id: f.id,
          created_at: f.created_at,
          statut: String(f.statut ?? "-"),

          region: pickAnswerValue(a["1.01"]),
          cercle: pickAnswerValue(a["1.02"]),
          structure: pickAnswerValue(a["1.03"]),
          responsable: pickAnswerValue(a["1.04"]),
          annee: pickAnswerValue(a["1.05"]),
          numero_fiche: pickAnswerValue(a["1.06"]),
        };
      });

      setRows(list);
    } catch (e: any) {
      setErr(e?.message ?? "Erreur chargement admin");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <AppShell title="Validation — Fiche 1">
      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {!err && !canValidate && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Accès refusé.
        </div>
      )}

      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">
              Fiches à valider (statut: soumis)
            </div>
            <div className="text-xs text-neutral-500">
              {busy ? "Chargement…" : `${rows.length} fiche(s)`}
            </div>
          </div>

          <button
            onClick={load}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Rafraîchir
          </button>
        </div>

        <div className="mt-4 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {r.numero_fiche || r.id}
                </div>

                <div className="text-xs text-neutral-500">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                  {" — "}
                  Année: {r.annee ?? "-"}
                  {" — "}
                  Responsable: {r.responsable ?? "-"}
                </div>

                <div className="text-xs text-neutral-500">
                  {r.region ?? "-"} / {r.cercle ?? "-"} / {r.structure ?? "-"}
                  {" — "}
                  statut: <span className="font-semibold">{r.statut}</span>
                </div>
              </div>

              <Link
                href={`/admin/fiche1/${r.id}`}
                className="shrink-0 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
              >
                Ouvrir
              </Link>
            </div>
          ))}

          {!busy && rows.length === 0 && (
            <div className="py-6 text-sm text-neutral-600">
              Aucune fiche soumise pour le moment.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
