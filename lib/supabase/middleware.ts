import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },

      set(name: string, value: string, options: CookieOptions) {
        // Update request cookies (Next middleware runtime)
        request.cookies.set({ name, value, ...options })

        // Recreate response to apply updated headers
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        response.cookies.set({ name, value, ...options })
      },

      remove(name: string, options: CookieOptions) {
        // Force delete
        const opts: CookieOptions = { ...options, maxAge: 0 }

        request.cookies.set({ name, value: "", ...opts })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        response.cookies.set({ name, value: "", ...opts })
      },
    },
  })

  // Rafraîchit la session automatiquement si nécessaire
  await supabase.auth.getSession()

  return response
}
