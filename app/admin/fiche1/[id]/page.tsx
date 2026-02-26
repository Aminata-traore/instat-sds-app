"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type ValidationStatus = "valide" | "rejete";

export default function AdminFiche1DetailPage() {
  const { loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const [role, setRole] = useState<string | null>(null);
  const [row, setRow] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);

      try {
        const supabase = supabaseClient(); // ✅ IMPORTANT

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

        const r = (prof?.role ?? "agent") as string;
        if (!alive) return;
        setRole(r);

        if (!["admin", "validateur"].includes(r)) {
          setError("Accès refusé: vous n’êtes pas validateur/admin.");
          return;
        }

        const { data, error: eRow } = await supabase
          .from("answers_fiche1")
          .select("*")
          .eq("id", id)
          .single();

        if (!alive) return;
        if (eRow) setError(eRow.message);
        else setRow(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Erreur inconnue");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const setStatus = async (statut_validation: ValidationStatus) => {
    setError(null);
    setBusy(true);

    try {
      const supabase = supabaseClient(); // ✅ IMPORTANT

      const { data: u, error: eUser } = await supabase.auth.getUser();
      if (eUser) throw new Error(eUser.message);

      const uid = u.user?.id;
      if (!uid) throw new Error("Utilisateur non connecté");

      const { error: eUpd } = await supabase
        .from("answers_fiche1")
        .update({
          statut_validation,
          validated_at: new Date().toISOString(),
          validated_by: uid,
          validation_comment: comment.trim() || null,
        })
        .eq("id", id);

      if (eUpd) throw new Error(eUpd.message);

      router.push("/admin/fiche1");
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
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
            <p>Date: {row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</p>
            <p>Année: {row.annee ?? "-"}</p>
            <p>N° fiche: {row.numero_fiche ?? "-"}</p>
            <p>Statut: {row.statut ?? "-"}</p>
            <p>Validation: {row.statut_validation ?? "-"}</p>
          </div>

          <div style={{ marginTop: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Données (JSON)</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(row.data ?? row, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ fontWeight: 700 }}>Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: "100%", height: 90, marginTop: 8 }}
              placeholder="Ex: champ manquant, incohérence, correction…"
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
