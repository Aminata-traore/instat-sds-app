/* =========================
   PROFILE TYPES
========================= */

export type Role = "agent" | "validateur" | "admin"

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
  updated_at: string
}

/* =========================
   FICHE 1 (NOUVEAU MODELE)
   - table: fiche1 (entête)
   - table: fiche1_activites (lignes)
========================= */

export type FicheStatut = "brouillon" | "soumis"

export type Fiche1 = {
  id: string
  region_id: string
  cercle_id: string
  structure_id: string
  responsable_nom: string
  annee: number
  numero_fiche: string
  statut: FicheStatut
  created_by: string
  created_at: string
  updated_at: string | null
}

export type Fiche1Activite = {
  id: string
  fiche1_id: string
  activite: string
  resultat: string
  produit_id: string | null
  source_finance_id: string | null
  source_verification_id: string | null
  observation: string | null
  created_at: string
}

/* =========================
   REFERENTIELS (OPTIONS)
========================= */

export type RefOption = {
  id: string
  libelle: string
}

/* =========================
   USER EXTENDED
========================= */

export type UserWithProfile = {
  user: {
    id: string
    email: string | null
  }
  profile: Profile | null
}
