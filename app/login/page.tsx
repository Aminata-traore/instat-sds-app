"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Si déjà connecté → dashboard
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = supabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        if (data.session) router.replace("/dashboard");
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const signIn = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const supabase = supabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      router.replace("/dashboard");
    } catch (e: any) {
      setMsg(e?.message ?? "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-xl font-extrabold tracking-tight">Connexion — INSTAT</div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@instat.ml"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Mot de passe</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          onClick={signIn}
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
      </div>
    </main>
  );
}
