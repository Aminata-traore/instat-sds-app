"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Role = "admin" | "validateur" | "agent" | string;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cx(
        "block rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("agent");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingUser(true);

      const { data: u } = await supabase.auth.getUser();

      if (!alive) return;

      setEmail(u.user?.email ?? null);

      if (u.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.user.id)
          .maybeSingle();

        if (!alive) return;

        setRole((prof?.role ?? "agent") as Role);
      }

      setLoadingUser(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight">INSTAT</span>
            <span className="text-sm text-neutral-500">SDS</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs text-neutral-500">Connecté</div>
              <div className="text-sm font-semibold text-neutral-800">
                {loadingUser ? "..." : email ?? "-"}
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border bg-white p-3">
          <div className="mb-3 px-3 py-2">
            <div className="text-xs text-neutral-500">Rôle</div>
            <div className="text-sm font-semibold">
              {loadingUser ? "..." : String(role)}
            </div>
          </div>

          <nav className="space-y-1">
            {role === "agent" && (
              <>
                <NavLink href="/dashboard/agent" label="Dashboard Agent" />
                <NavLink href="/dashboard/fiche1/new" label="Nouvelle fiche" />
                <NavLink href="/dashboard/fiche1" label="Mes fiches" />
              </>
            )}

            {(role === "validateur" || role === "admin") && (
              <>
                <NavLink href="/dashboard/validateur" label="Dashboard Validateur" />
                <NavLink href="/admin" label="Validation des fiches" />
              </>
            )}

            {role === "admin" && (
              <>
                <NavLink href="/dashboard/admin" label="Dashboard Admin" />
                <NavLink href="/admin" label="Administration" />
              </>
            )}

            <NavLink href="/profile" label="Mon profil" />
          </nav>
        </aside>

        <main className="rounded-2xl border bg-white p-5">
          <div className="mb-4">
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900">
              {title}
            </h1>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
