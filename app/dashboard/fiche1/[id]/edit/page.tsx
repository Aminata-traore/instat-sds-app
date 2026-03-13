export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/app/_components/AppShell";
import EditFicheForm from "./EditFicheForm";

export default async function EditFichePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "agent" || profile.is_active === false) {
    redirect("/profile");
  }

  const { data: fiche } = await supabase
    .from("fiche1")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!fiche || fiche.created_by !== session.user.id || fiche.statut !== "brouillon") {
    redirect("/dashboard/fiche1");
  }

  const { data: answers } = await supabase
    .from("answers_fiche1")
    .select("question_code,value_text,value_number,value_bool,value_json")
    .eq("fiche1_id", params.id);

  return (
    <AppShell title="Modifier la fiche">
      <EditFicheForm fiche={fiche} answers={answers ?? []} />
    </AppShell>
  );
}
