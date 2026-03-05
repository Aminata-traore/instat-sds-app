"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export type Role = "agent" | "validateur" | "admin";

export function useRole() {
  const supabase = useMemo(() => supabaseClient(), []);

  const [role, setRole] = useState<Role>("agent");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchRole = async () => {
      const { data: u, error: userErr } = await supabase.auth.getUser();

      if (userErr || !u.user) {
        if (alive) {
          setRole("agent");
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", u.user.id)
        .maybeSingle();

      if (!alive) return;

      if (!error && data?.role) {
        setRole(data.role as Role);
      } else {
        setRole("agent");
      }

      setLoading(false);
    };

    fetchRole();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { role, loading };
}
