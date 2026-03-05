# INSTAT SDS
### Système de Digitalisation des Fiches Statistiques

Plateforme web permettant la **saisie, la validation et le suivi des fiches statistiques de l’INSTAT**.

L'application remplace les fiches Excel par des **formulaires web dynamiques**, avec un système de validation par rôles.

---

# Fonctionnalités

### Agent
- création d’une fiche statistique
- sauvegarde en brouillon
- soumission au validateur
- consultation des fiches

### Validateur
- visualisation des fiches soumises
- validation ou rejet des fiches
- ajout de commentaire

### Administrateur
- gestion des utilisateurs
- attribution des rôles
- supervision globale

---

# Technologies utilisées

### Frontend
- **Next.js 14 (App Router)**
- **React**
- **Tailwind CSS**
- **ShadCN UI**
- **Recharts**

### Backend
- **Supabase**
  - Authentification
  - Base de données PostgreSQL
  - RLS (Row Level Security)

### Déploiement
- **Vercel**

---

# Architecture du projet
