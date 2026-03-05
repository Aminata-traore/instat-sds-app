import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import Fiche1DynamicForm from "@/app/dashboard/fiche1/components/Fiche1DynamicForm";

export const dynamic = "force-dynamic";

export default async function NewFiche1Page() {
  const supabase = supabaseServerClient(cookies());

  // Vérifier session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/dashboard/fiche1/new");
  }

  // Vérifier rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  // si admin ou validateur → redirection admin
  if (profile?.role === "admin" || profile?.role === "validateur") {
    redirect("/admin");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fiche 1 — Nouvelle saisie</h1>
        <p className="text-sm text-gray-600">
          Bilan des activités statistiques de l'année N-1
        </p>
      </div>

      <Fiche1DynamicForm />
    </div>
  );
}
