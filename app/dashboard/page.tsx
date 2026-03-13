export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Erreur chargement profil dashboard:", error);
    redirect("/profile");
  }

  if (!profile?.role) {
    redirect("/profile");
  }

  if (profile.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (profile.role === "validateur") {
    redirect("/dashboard/validateur");
  }

  if (profile.role === "agent") {
    redirect("/dashboard/agent");
  }

  redirect("/profile");
}
