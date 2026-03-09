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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role ?? "agent";

  if (role === "admin") redirect("/dashboard/admin");
  if (role === "validateur") redirect("/dashboard/validateur");
  redirect("/dashboard/agent");
}
