"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type FicheRow = {
  id: string;
  created_at: string;
  annee: number | null;
  numero_fiche: string | null;
  statut: "brouillon" | "soumis" | string | null;
};

export default function MesFichesPage() {
  const { loading } = useRequireAuth();

  const [rows, setRows] = useState<FicheRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadRows = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);

    try {
      // ✅ CRÉATION DU CLIENT SUPABASE (OBLIGATOIRE)
      const supabase = supabaseClient();

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);

      if (!userData.user) {
        setInfo("Utilisateur non connecté.");
        setRows([]);
        return;
      }

      // Avec RLS : Supabase renvoie uniquement les lignes de l'utilisateur
      const { data, error } = await supabase
        .from("answers_fiche1")
        .select("id, created_at, annee, numero_fiche, statut")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setRows((data ?? []) as FicheRow[]);
      if (!data || data.length === 0) {
        setInfo("Aucune fiche pour le moment.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
      setRows([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading) loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1100 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>
          Mes fiches (Fiche 1)
        </h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadRows} disabled={busy} style={{ padding: "8px 12px" }}>
            {busy ? "..." : "Rafraîchir"}
          </button>

          <Link
            href="/fiche1/nouvelle"
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 10 }}
          >
            ➕ Nouvelle fiche
          </Link>
        </div>
      </div>

      {error && <p style={{ marginTop: 12, color: "crimson" }}>Erreur : {error}</p>}
      {info && !error && <p style={{ marginTop: 12 }}>{info}</p>}

      <table style={{ marginTop: 12, width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Date</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Année</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>N° fiche</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Statut</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {r.annee ?? "-"}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {r.numero_fiche ?? "-"}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {r.statut ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
