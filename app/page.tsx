"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function IndexPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Vérification de la session…");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data.session) {
        setMsg("Redirection vers le tableau de bord…");
        router.replace("/dashboard");
      } else {
        setMsg("Redirection vers la connexion…");
        router.replace("/login");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-6">
        <div className="text-xl font-extrabold tracking-tight">INSTAT — SDS</div>
        <p className="mt-2 text-sm text-neutral-600">{msg}</p>
      </div>
    </main>
  );
}
