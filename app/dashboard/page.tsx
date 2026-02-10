"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";

export default function DashboardPage() {
  const { loading } = useRequireAuth();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return <main style={{ padding: 24 }}>Chargement...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tableau de bord — INSTAT</h1>
      <p style={{ marginTop: 8 }}>Connecté : {email ?? "-"}</p>

      <div style={{ marginTop: 14, display: "flex", gap: 14 }}>
        <Link href="/fiche1/nouvelle">➕ Nouvelle Fiche 1</Link>
        <Link href="/fiche1/mes-fiches">📄 Mes Fiches</Link>
        <button onClick={logout}>Se déconnecter</button>
      </div>
    </main>
  );
}
