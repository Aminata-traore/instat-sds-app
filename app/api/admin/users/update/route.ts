import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, role, is_active } = body ?? {};

    if (!userId || !role || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Champs invalides." }, { status: 400 });
    }

    if (!["agent", "validateur", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    const supabase = supabaseServerClient(cookies());

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: me } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!me || me.role !== "admin" || me.is_active === false) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    if (userId === session.user.id && is_active === false) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas désactiver votre propre compte." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role, is_active })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}
