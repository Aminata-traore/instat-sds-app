/* =========================
   PROFILE TYPES
========================= */

export type Role = "agent" | "validateur" | "admin";

export type Profile = {
  id: string;
  email: string | null;              // ✅ peut être null
  full_name: string | null;
  role: Role;
  created_at: string | null;         // ✅ parfois null selon insert/trigger
  updated_at: string | null;         // ✅ souvent null
};

/* =========================
   FICHE 1 (MODELE)
   - table: fiche1 (entête)
   - table: fiche1_activites (lignes)
========================= */

export type FicheStatut = "brouillon" | "soumis" | "valide" | "rejete"; // ✅ aligné app

export type Fiche1 = {
  id: string;

  // ✅ ids référentiels: en pratique souvent integer
  region_id: number | null;
  cercle_id: number | null;
  structure_id: number | null;

  responsable_nom: string | null;

  // année N-1
  annee: number | null;

  numero_fiche: string | null;

  statut: FicheStatut;

  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Fiche1Activite = {
  id: string;
  fiche1_id: string;

  activite: string;
  resultat: string | null;

  produit_id: number | null;
  source_finance_id: number | null;
  source_verification_id: number | null;

  observation: string | null;
  created_at: string | null;
};

/* =========================
   REFERENTIELS (OPTIONS)
========================= */

// ✅ compatible ref_regions/ref_cercles : id souvent number, label/libellé string
export type RefOption = {
  id: number;
  label: string;
};

/* =========================
   USER EXTENDED
========================= */

export type UserWithProfile = {
  user: {
    id: string;
    email: string | null;
  };
  profile: Profile | null;
};
