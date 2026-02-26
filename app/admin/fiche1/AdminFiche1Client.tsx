"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";
import { supabaseClient } from "@/lib/supabase/client";

type Row = { id: string; created_at?: string; statut?: string };

export function AdminFiche1Client() {
  const { loading } = useRequireAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const run = async () => {
      setBusy(true);
      setErr(null);
      try {
        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from("answers_fiche1")
          .select("id, created_at, statut")
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        setRows((data ?? []) as Row[]);
      } catch (e: any) {
        setErr(e?.message ?? "Erreur chargement admin");
      } finally {
        setBusy(false);
      }
    };
    run();
  }, []);

  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <AppShell title="Admin — Validation Fiche 1">
      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Fiches reçues</div>
            <div className="text-xs text-neutral-500">
              {busy ? "Chargement…" : `${rows.length} fiche(s)`}
            </div>
          </div>

          <button
            onClick={() => location.reload()}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
          >
            Rafraîchir
          </button>
        </div>

        <div className="mt-4 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-semibold">{r.id}</div>
                <div className="text-xs text-neutral-500">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "-"} — statut:{" "}
                  {r.statut ?? "brouillon"}
                </div>
              </div>

              <Link
                href={`/admin/fiche1/${r.id}`}
                className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
              >
                Ouvrir
              </Link>
            </div>
          ))}

          {!busy && rows.length === 0 && (
            <div className="py-6 text-sm text-neutral-600">Aucune fiche pour le moment.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
