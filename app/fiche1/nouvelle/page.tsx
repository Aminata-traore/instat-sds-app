"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

type SaveMode = "brouillon" | "soumis";

export default function NouvelleFiche1Page() {
  const { loading } = useRequireAuth();

  const [region, setRegion] = useState("");
  const [cercle, setCercle] = useState("");
  const [structure, setStructure] = useState("");
  const [responsable, setResponsable] = useState("");
  const [annee, setAnnee] = useState("");
  const [numeroFiche, setNumeroFiche] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const anneeInt = useMemo(() => {
    const n = parseInt(annee, 10);
    return Number.isFinite(n) ? n : null;
  }, [annee]);

  const validate = () => {
    if (!region.trim()) return "Région obligatoire";
    if (!cercle.trim()) return "Cercle obligatoire";
    if (!structure.trim()) return "Structure obligatoire";
    if (!responsable.trim()) return "Nom du responsable obligatoire";
    if (!anneeInt) return "Année invalide";
    if (!numeroFiche.trim()) return "Numéro de fiche obligatoire";
    return null;
  };

  const save = async (mode: SaveMode) => {
    setMsg(null);
    const err = validate();
    if (err) return setMsg(err);

    setBusy(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Utilisateur non connecté");

      const payload = {
        user_id: userData.user.id,
        annee: anneeInt,
        numero_fiche: numeroFiche.trim(),
        statut: mode === "soumis" ? "soumis" : "brouillon",
        submitted_at: mode === "soumis" ? new Date().toISOString() : null,
        data: {
          section1: {
            region: region.trim(),
            cercle: cercle.trim(),
            structure: structure.trim(),
            responsable: responsable.trim(),
            annee: anneeInt,
            numero_fiche: numeroFiche.trim(),
          },
        },
      };

      const { error } = await supabase.from("answers_fiche1").insert(payload);
      if (error) throw new Error(error.message);

      setMsg(mode === "soumis" ? "✅ Fiche soumise !" : "✅ Brouillon enregistré !");
      if (mode === "soumis") {
        // reset léger
        setRegion("");
        setCercle("");
        setStructure("");
        setResponsable("");
        setAnnee("");
        setNumeroFiche("");
      }
    } catch (e: any) {
      setMsg(`Erreur: ${e.message ?? "inconnue"}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Fiche 1 — Identification (Section 1)
      </h1>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <input placeholder="Région" value={region} onChange={(e) => setRegion(e.target.value)} />
        <input placeholder="Cercle" value={cercle} onChange={(e) => setCercle(e.target.value)} />
        <input placeholder="Structure" value={structure} onChange={(e) => setStructure(e.target.value)} />
        <input placeholder="Nom & prénom du responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
        <input placeholder="Année (ex: 2025)" value={annee} onChange={(e) => setAnnee(e.target.value)} />
        <input placeholder="Numéro de fiche" value={numeroFiche} onChange={(e) => setNumeroFiche(e.target.value)} />
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button disabled={busy} onClick={() => save("brouillon")} style={{ padding: 10 }}>
          {busy ? "..." : "Enregistrer brouillon"}
        </button>
        <button disabled={busy} onClick={() => save("soumis")} style={{ padding: 10 }}>
          {busy ? "..." : "Soumettre"}
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
