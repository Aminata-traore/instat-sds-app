"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

export default function AdminFiche1DetailPage() {
  const { loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [role, setRole] = useState<string | null>(null);
  const [row, setRow] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setError(null);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;

      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      const r = (prof?.role ?? "agent") as string;
      setRole(r);

      if (!["admin", "validateur"].includes(r)) {
        setError("Accès refusé: vous n’êtes pas validateur/admin.");
        return;
      }

      const { data, error } = await supabase
        .from("answers_fiche1")
        .select("*")
        .eq("id", id)
        .single();

      if (error) setError(error.message);
      else setRow(data);
    })();
  }, [id]);

  const setStatus = async (statut_validation: "valide" | "rejete") => {
    setError(null);
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from("answers_fiche1")
        .update({
          statut_validation,
          validated_at: new Date().toISOString(),
          validated_by: uid,
          validation_comment: comment.trim() || null,
        })
        .eq("id", id);

      if (error) throw new Error(error.message);

      router.push("/admin/fiche1");
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Validation — Fiche 1</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>Rôle: {role ?? "-"}</p>

      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      {!row ? (
        <p style={{ marginTop: 12 }}>Chargement fiche…</p>
      ) : (
        <>
          <div style={{ marginTop: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Résumé</h2>
            <p>Date: {new Date(row.created_at).toLocaleString()}</p>
            <p>Année: {row.annee ?? "-"}</p>
            <p>N° fiche: {row.numero_fiche ?? "-"}</p>
            <p>Statut: {row.statut ?? "-"}</p>
            <p>Validation: {row.statut_validation ?? "-"}</p>
          </div>

          <div style={{ marginTop: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Données (JSON)</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(row.data, null, 2)}</pre>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontWeight: 700 }}>Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", height: 90, marginTop: 8 }}
              placeholder="Ex: corriger la structure, champ manquant, etc."
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button disabled={busy} onClick={() => setStatus("valide")} style={{ padding: 10 }}>
              {busy ? "..." : "✅ Valider"}
            </button>
            <button disabled={busy} onClick={() => setStatus("rejete")} style={{ padding: 10 }}>
              {busy ? "..." : "❌ Rejeter"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
