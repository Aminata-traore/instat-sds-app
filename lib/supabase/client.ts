import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * IMPORTANT:
 * - Vercel/Next prerender (build) exécute du code côté serveur.
 * - On NE DOIT PAS créer Supabase côté serveur avec NEXT_PUBLIC_*,
 *   sinon on casse le build ("supabaseUrl is required").
 *
 * => On crée le client uniquement côté navigateur.
 */
export function supabaseClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("supabaseClient() must be called in the browser (client component).");
  }

  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  _supabase = createClient(url, anon);
  return _supabase;
}
