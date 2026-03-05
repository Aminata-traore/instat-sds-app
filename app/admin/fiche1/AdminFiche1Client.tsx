"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";
import { supabaseClient } from "@/lib/supabase/client";

type Role = "admin" | "validateur" | "agent" | string;

type Row = {
  id: string;
  created_at: string | null;
  statut: "brouillon" | "soumis" | "valide" | "rejete" | string;
  annee: number | null;
  numero_fiche: string | null;
  responsable_nom: string | null;
  region_id: string | null;
  cercle_id: string | null;
  structure_id: string | null;
};

export function AdminFiche1Client() {
  const { loading } = useRequireAuth();

  const [role, setRole] = useState<Role>("agent");
  const [rows, setRows] = useState<Row[]>([]);
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
      const supabase = supabaseClient();

      // 1) Rôle (sécurité front)
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

      // 2) Charger les fiches soumises (priorité validation)
      const { data, error } = await supabase
        .from("fiche1")
        .select(
          "id, created_at, statut, annee, numero_fiche, responsable_nom, region_id, cercle_id, structure_id"
        )
        .in("statut", ["soumis"]) // ✅ uniquement celles à valider
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setRows((data ?? []) as Row[]);
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
            <div className="text-sm font-semibold">Fiches à valider (statut: soumis)</div>
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
                  {r.numero_fiche ?? r.id}
                </div>

                <div className="text-xs text-neutral-500">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                  {" — "}
                  Année: {r.annee ?? "-"}
                  {" — "}
                  Responsable: {r.responsable_nom ?? "-"}
                </div>

                <div className="text-xs text-neutral-500">
                  {r.region_id ?? "-"} / {r.cercle_id ?? "-"} / {r.structure_id ?? "-"}
                  {" — "}
                  statut: <span className="font-semibold">{r.statut ?? "-"}</span>
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
