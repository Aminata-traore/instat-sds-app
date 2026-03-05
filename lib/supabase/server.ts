import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur (Server Components / Server Actions / Route Handlers)
 * basé sur les cookies Next.js.
 */
export function supabaseServerClient(
  cookieStore: ReturnType<typeof cookies> = cookies()
): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },

      set(name: string, value: string, options: CookieOptions) {
        // ⚠️ Server Components: cookieStore.set peut throw (comportement normal)
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // OK si middleware gère la session
        }
      },

      remove(name: string, options: CookieOptions) {
        const opts: CookieOptions = {
          ...options,
          maxAge: 0,
          expires: new Date(0),
        };

        try {
          cookieStore.set({ name, value: "", ...opts });
        } catch {
          // OK si middleware gère la session
        }
      },
    },
  });
}
