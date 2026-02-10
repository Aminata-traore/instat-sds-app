"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tableau de bord — INSTAT</h1>
      <p style={{ marginTop: 8 }}>Connecté : {email ?? "Non connecté"}</p>

      <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
        <Link href="/fiche1/nouvelle">➕ Nouvelle Fiche 1</Link>
        <Link href="/fiche1/mes-fiches">📄 Mes Fiches</Link>
      </div>
    </main>
  );
}
