"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type ValidationStatus = "valide" | "rejete";

type Fiche1 = {
  id: string;
  region_id: string;
  cercle_id: string;
  structure_id: string;
  responsable_nom: string;
  annee: number;
  numero_fiche: string;
  statut: "brouillon" | "soumis" | "valide" | "rejete";
  created_by: string | null;
  created_at: string | null;
};

type Fiche1Activite = {
  id: string;
  fiche1_id: string;
  activite: string;
  resultat: string | null;
  produit_id: string | null;
  source_finance_id: string | null;
  source_verification_id: string | null;
  observation: string | null;
};

export default function AdminFiche1DetailPage() {
  const { loading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => String((params as any)?.id ?? ""), [params]);

  const [role, setRole] = useState<string | null>(null);
  const [fiche, setFiche] = useState<Fiche1 | null>(null);
  const [activites, setActivites] = useState<Fiche1Activite[]>([]);
  const [comment, setComment] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);

      try {
        const supabase = supabaseClient();

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

        const r = (prof?.role ?? "agent") as string;
        if (!alive) return;
        setRole(r);

        if (!["admin", "validateur"].includes(r)) {
          setError("Accès refusé: vous n’êtes pas validateur/admin.");
          return;
        }

        // 2) charger fiche1 (entête)
        const { data: f, error: eF } = await supabase
          .from("fiche1")
          .select("*")
          .eq("id", id)
          .single();

        if (!alive) return;
        if (eF) throw new Error(eF.message);
        setFiche(f as Fiche1);

        // 3) charger les activités liées
        const { data: acts, error: eA } = await supabase
          .from("fiche1_activites")
          .select("*")
          .eq("fiche1_id", id)
          .order("id", { ascending: true });

        if (!alive) return;
        if (eA) throw new Error(eA.message);
        setActivites((acts ?? []) as Fiche1Activite[]);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Erreur inconnue");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const setStatus = async (statut: ValidationStatus) => {
    setError(null);
    setBusy(true);

    try {
      const supabase = supabaseClient();

      const { data: u, error: eUser } = await supabase.auth.getUser();
      if (eUser) throw new Error(eUser.message);

      const uid = u.user?.id;
      if (!uid) throw new Error("Utilisateur non connecté");

      // IMPORTANT:
      // Ici, on se limite à mettre à jour le statut de la fiche.
      // Si tu veux enregistrer le commentaire en base, on peut ajouter une table fiche1_validations.
      const { error: eUpd } = await supabase
        .from("fiche1")
        .update({
          statut: statut,
          // optionnel: si tu ajoutes ces colonnes plus tard:
          // validated_at: new Date().toISOString(),
          // validated_by: uid,
          // validation_comment: comment.trim() || null,
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
    <main style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Validation — Fiche 1</h1>
      <p style={{ marginTop: 6, opacity: 0.7 }}>Rôle: {role ?? "-"}</p>

      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      {!fiche ? (
        <p style={{ marginTop: 12 }}>Chargement fiche…</p>
      ) : (
        <>
          {/* Résumé fiche */}
          <div
            style={{
              marginTop: 14,
              padding: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 1 — Identification</h2>
            <p>Date: {fiche.created_at ? new Date(fiche.created_at).toLocaleString() : "-"}</p>
            <p>Région: {fiche.region_id ?? "-"}</p>
            <p>Cercle: {fiche.cercle_id ?? "-"}</p>
            <p>Structure: {fiche.structure_id ?? "-"}</p>
            <p>Responsable: {fiche.responsable_nom ?? "-"}</p>
            <p>Année (N-1): {fiche.annee ?? "-"}</p>
            <p>N° fiche: {fiche.numero_fiche ?? "-"}</p>
            <p>Statut: {fiche.statut ?? "-"}</p>
          </div>

          {/* Activités */}
          <div
            style={{
              marginTop: 14,
              padding: 14,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Section 2 — Activités</h2>

            {activites.length === 0 ? (
              <p style={{ marginTop: 8, opacity: 0.7 }}>Aucune activité enregistrée.</p>
            ) : (
              <div style={{ overflowX: "auto", marginTop: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[
                        "Activité",
                        "Résultat attendu",
                        "Produit",
                        "Source financement",
                        "Vérification",
                        "Observations",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: 10,
                            borderBottom: "1px solid #e5e7eb",
                            fontSize: 13,
                            color: "#111827",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activites.map((a) => (
                      <tr key={a.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.activite}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.resultat ?? "-"}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.produit_id ?? "-"}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.source_finance_id ?? "-"}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.source_verification_id ?? "-"}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
                          {a.observation ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Commentaire */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontWeight: 700 }}>Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                height: 90,
                marginTop: 8,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 10,
              }}
              placeholder="Ex: champ manquant, incohérence, correction…"
            />
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              (Pour enregistrer ce commentaire en base, on ajoutera une table dédiée aux validations.)
            </p>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button
              disabled={busy}
              onClick={() => setStatus("valide")}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "white",
                fontWeight: 700,
              }}
            >
              {busy ? "..." : "✅ Valider"}
            </button>

            <button
              disabled={busy}
              onClick={() => setStatus("rejete")}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "white",
                fontWeight: 700,
              }}
            >
              {busy ? "..." : "❌ Rejeter"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
