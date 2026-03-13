import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, role, password } = body ?? {};

    if (!fullName || !email || !role || !password) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const userId = created.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Utilisateur non créé." }, { status: 400 });
    }

    const { error: profileErr } = await admin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        role,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erreur serveur." },
      { status: 500 }
    );
  }
}
