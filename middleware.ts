import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // On crée une réponse "next" que Supabase peut modifier (cookies)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ⚠️ Sécurité: si env manquantes, on laisse passer (sinon build/runtime casse)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Met à jour le cookie dans la requête (edge runtime)
        request.cookies.set({ name, value, ...options });

        // Recrée une réponse NextResponse (sinon certains environnements ignorent)
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        // Met à jour le cookie dans la réponse
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });

        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });

        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  const pathname = request.nextUrl.pathname;

  // ✅ Routes publiques (ne pas bloquer)
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login");

  // ✅ Routes protégées (exemples selon ton projet)
  const isDashboard = pathname.startsWith("/dashboard");
  const isProfile = pathname.startsWith("/profile");
  const isFiches = pathname.startsWith("/fiches") || pathname.startsWith("/fiche1");
  const isValidator = pathname.startsWith("/validator");
  const isAdmin = pathname.startsWith("/admin");

  const isProtected = isDashboard || isProfile || isFiches || isValidator || isAdmin;

  // 1) Pas connecté -> redirection vers login pour routes protégées
  if (!session && isProtected && !isPublic) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2) Connecté -> contrôle rôle
  if (session) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    // Si on n'arrive pas à lire le profil (RLS/config), on évite l'accès admin/validator
    const role = !error ? profile?.role : null;

    // Admin-only
    if (isAdmin && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Validator-only (validateur + admin)
    if (isValidator && role !== "validateur" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // (Optionnel) Si tu veux empêcher agent d’accéder à /validator ou /admin même si bug
    if ((isAdmin || isValidator) && role === "agent") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
