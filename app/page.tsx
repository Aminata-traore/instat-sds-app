"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { count, error } = await supabase
        .from("ref_indicateurs")
        .select("*", { count: "exact", head: true });

      if (error) setError(error.message);
      else setCount(count ?? 0);
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>INSTAT — Test Supabase</h1>

      {error ? (
        <p style={{ color: "red" }}>Erreur : {error}</p>
      ) : (
        <p>
          Nombre d’indicateurs dans Supabase : <b>{count ?? "..."}</b>
        </p>
      )}
    </main>
  );
}
