"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type FicheRow = {
  id: string;
  created_at?: string;
  annee?: number | null;
  numero_fiche?: string | null;
  statut?: string | null;
};

export default function MesFichesPage() {
  const { loading } = useRequireAuth();
  const [rows, setRows] = useState<FicheRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("answers_fiche1")
        .select("id, created_at, annee, numero_fiche, statut")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) setError(error.message);
      else setRows((data ?? []) as any);
    })();
  }, []);

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Mes fiches (Fiche 1)</h1>

      {error && <p style={{ color: "crimson" }}>Erreur: {error}</p>}

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
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.annee ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.numero_fiche ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.statut ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
