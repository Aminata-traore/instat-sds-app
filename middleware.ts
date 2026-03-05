import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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
        request.cookies.set({ name, value, ...options })

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })

        response.cookies.set({ name, value, ...options })
      },

      remove(name: string, options: CookieOptions) {
        // ✅ force suppression cookie
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

  const { data } = await supabase.auth.getSession()
  const session = data.session

  const pathname = request.nextUrl.pathname

  // ✅ Routes publiques
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth")

  // ✅ Routes protégées
  const isDashboard = pathname.startsWith("/dashboard")
  const isProfile = pathname.startsWith("/profile")
  const isFiches = pathname.startsWith("/fiche1") || pathname.startsWith("/fiches")
  const isValidator = pathname.startsWith("/validator")
  const isAdmin = pathname.startsWith("/admin")

  const isProtected = isDashboard || isProfile || isFiches || isValidator || isAdmin

  // 1) Pas connecté -> redirection vers login
  if (!session && isProtected && !isPublic) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 2) Connecté -> contrôle rôle (admin/validator)
  if (session) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()

    const role = !error ? profile?.role : null

    // Admin-only
    if (isAdmin && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Validator-only (validateur + admin)
    if (isValidator && role !== "validateur" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Optionnel hardening (déjà couvert, mais ok)
    if ((isAdmin || isValidator) && role === "agent") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
