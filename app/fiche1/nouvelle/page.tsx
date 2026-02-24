"use client";

import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";
import { Fiche1Form } from "@/app/fiche1/_components/Fiche1Form";

export default function NouvelleFiche1Page() {
  const { loading } = useRequireAuth();
  const router = useRouter();

  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <AppShell title="Fiche 1 — Nouvelle saisie">
      <Fiche1Form variant="create" onSaved={(id) => router.replace(`/fiche1/${id}`)} />
    </AppShell>
  );
}
