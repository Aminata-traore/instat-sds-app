"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Role = "admin" | "validateur" | "agent" | string;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

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

      const { data, error } = await supabase.auth.getUser();
      if (!alive) return;

      if (error) {
        console.error(error);
        setEmail(null);
        setRole("agent");
        setLoadingUser(false);
        return;
      }

      const user = data.user;
      setEmail(user?.email ?? null);

      if (user?.id) {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (profErr) {
          console.error(profErr);
          setRole("agent");
        } else {
          setRole((prof?.role ?? "agent") as Role);
        }
      }

      setLoadingUser(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const canValidate = useMemo(
    () => ["admin", "validateur"].includes(String(role)),
    [role]
  );

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login"); // ✅ cohérent avec ton app/auth/login
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
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

      {/* LAYOUT */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[240px_1fr]">
        {/* SIDEBAR */}
        <aside className="rounded-2xl border bg-white p-3">
          <div className="mb-2 px-3 py-2">
            <div className="text-xs text-neutral-500">Rôle</div>
            <div className="text-sm font-semibold">
              {loadingUser ? "..." : String(role)}
            </div>
          </div>

          <nav className="space-y-1">
            <NavLink href="/dashboard" label="Tableau de bord" />

            {/* ✅ Objectif: Fiche 1 dans Dashboard */}
            <NavLink href="/dashboard/fiche1/new" label="Nouvelle Fiche 1" />

            {/* ✅ Mets ce lien seulement si tu as une page dashboard/fiche1/mes-fiches
               (sinon commente-le pour éviter un lien cassé) */}
            <NavLink href="/dashboard/fiche1/mes-fiches" label="Mes Fiches" />

            {/* ✅ Admin/validateur */}
            {canValidate && <NavLink href="/admin" label="Espace validation" />}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
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
