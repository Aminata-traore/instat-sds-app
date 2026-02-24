"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export function useRequireAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const supabase = supabaseClient();

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) router.replace("/login");
      else setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return { loading };
}
