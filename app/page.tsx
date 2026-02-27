"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const supabase = supabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!alive) return;

        if (data.session) router.replace("/dashboard");
        else router.replace("/login");
      } catch {
        // Si supabase env manquante côté client, on renvoie vers /login
        if (!alive) return;
        router.replace("/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-700">
        Redirection…
      </div>
    </main>
  );
}
