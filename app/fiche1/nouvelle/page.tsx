"use client";

import { useState } from "react";

export default function NouvelleFiche1Page() {
  const [region, setRegion] = useState("");
  const [cercle, setCercle] = useState("");
  const [structure, setStructure] = useState("");
  const [responsable, setResponsable] = useState("");
  const [annee, setAnnee] = useState("");
  const [numeroFiche, setNumeroFiche] = useState("");

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>
        Fiche 1 — Identification (Section 1)
      </h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        On met d’abord le formulaire complet, puis on branchera l’enregistrement Supabase.
      </p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        <input placeholder="Région" value={region} onChange={(e) => setRegion(e.target.value)} />
        <input placeholder="Cercle" value={cercle} onChange={(e) => setCercle(e.target.value)} />
        <input placeholder="Structure" value={structure} onChange={(e) => setStructure(e.target.value)} />
        <input placeholder="Nom & prénom du responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
        <input placeholder="Année (N-1)" value={annee} onChange={(e) => setAnnee(e.target.value)} />
        <input placeholder="Numéro de fiche" value={numeroFiche} onChange={(e) => setNumeroFiche(e.target.value)} />
      </div>

      <button style={{ marginTop: 16, padding: 10 }}>
        Enregistrer (à brancher)
      </button>
    </main>
  );
}
