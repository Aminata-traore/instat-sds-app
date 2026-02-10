"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type Row = {
  id: string;
  created_at: string;
  annee: number | null;
  numero_fiche: string | null;
  statut: string | null;
  statut_validation: string | null;
  user_id: string | null;
};

export default function AdminFiche1ListPage() {
  const { loading } = useRequireAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;

      // role
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();

      if (profErr) {
        setError(profErr.message);
        return;
      }
      const r = (prof?.role ?? "agent") as string;
      setRole(r);

      if (!["admin", "validateur"].includes(r)) {
        setError("Accès refusé: vous n’êtes pas validateur/admin.");
        return;
      }

      // list only "soumis" (ou en attente)
      const { data, error } = await supabase
        .from("answers_fiche1")
        .select("id, created_at, annee, numero_fiche, statut, statut_validation, user_id")
        .in("statut_validation", ["soumis", "brouillon"]) // si tu veux voir tout, on change après
        .order("created_at", { ascending: false });

      if (error) setError(error.message);
      else setRows((data ?? []) as any);
    })();
  }, []);

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin — Validation Fiche 1</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>Rôle: {role ?? "-"}</p>

      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      <table style={{ marginTop: 14, width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Date</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Année</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>N° fiche</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Statut</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Validation</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                {new Date(r.created_at).toLocaleString()}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.annee ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.numero_fiche ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.statut ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{r.statut_validation ?? "-"}</td>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                <Link href={`/admin/fiche1/${r.id}`}>Ouvrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
