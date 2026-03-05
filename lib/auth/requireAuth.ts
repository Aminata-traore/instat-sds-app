"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(() => supabaseClient(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const goLogin = () => {
      const redirectTo = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/auth/login?redirectTo=${redirectTo}`);
    };

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      if (error) {
        // en cas d'erreur session, on renvoie login
        goLogin();
        return;
      }

      if (!data.session) {
        goLogin();
        return;
      }

      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        goLogin();
      } else {
        // si session créée (ex: login dans un autre onglet), on débloque
        if (alive) setLoading(false);
      }
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [router, pathname, supabase]);

  return { loading };
}
