"use client";

import Link from "next/link";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";

export default function DashboardPage() {
  const { loading } = useRequireAuth();
  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <AppShell title="Tableau de bord">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-800">Saisie</div>
          <p className="mt-1 text-sm text-neutral-600">
            Crée une nouvelle fiche 1 et sauvegarde en brouillon ou soumets pour validation.
          </p>
          <Link href="/fiche1/nouvelle" className="mt-3 inline-flex rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white">
            ➕ Nouvelle fiche 1
          </Link>
        </div>

        <div className="rounded-2xl border bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-800">Historique</div>
          <p className="mt-1 text-sm text-neutral-600">Consulte tes fiches et continue les brouillons.</p>
          <Link href="/fiche1/mes-fiches" className="mt-3 inline-flex rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-100">
            📄 Mes fiches
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
