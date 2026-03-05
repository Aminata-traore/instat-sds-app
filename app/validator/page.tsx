import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ValidatorPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = (profile?.role ?? "agent") as Role;

  // accès validation uniquement validateur/admin
  if (role !== "validateur" && role !== "admin") {
    redirect("/dashboard");
  }

  // redirection vers la page centrale de validation
  redirect("/admin");
}
