import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServerClient(cookies());

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!profile || profile.role !== "agent" || profile.is_active === false) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const ficheId = params.id;

    const { data: fiche } = await supabase
      .from("fiche1")
      .select("id,created_by,statut")
      .eq("id", ficheId)
      .maybeSingle();

    if (!fiche) {
      return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
    }

    if (fiche.created_by !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    if (fiche.statut !== "brouillon") {
      return NextResponse.json(
        { error: "Seul un brouillon peut être soumis." },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabase
      .from("fiche1")
      .update({ statut: "soumis" })
      .eq("id", ficheId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    await supabase.from("validation_history").insert([
      {
        fiche_id: ficheId,
        action: "soumis",
        user_id: session.user.id,
        comment: null,
      },
    ]);

    await supabase.from("system_logs").insert([
      {
        module: "fiche1",
        action: "soumis",
        target_id: ficheId,
        actor_id: session.user.id,
        metadata: { source: "submit_draft_button" },
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}
