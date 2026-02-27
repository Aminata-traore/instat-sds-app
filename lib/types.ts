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
   FICHE 1 TYPES
========================= */

export type FicheStatut = "brouillon" | "soumis"
export type ValidationStatut = "valide" | "rejete" | null

export type Fiche1Data = Record<string, unknown> // JSONB sécurisé

export type Fiche1 = {
  id: string
  user_id: string
  titre: string
  annee: number | null
  numero_fiche: string | null
  statut: FicheStatut
  statut_validation: ValidationStatut
  validation_comment: string | null
  validated_at: string | null
  validated_by: string | null
  created_at: string
  updated_at: string
  data: Fiche1Data
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
