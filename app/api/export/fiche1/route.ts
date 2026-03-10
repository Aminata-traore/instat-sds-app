import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServerClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const supabase = supabaseServerClient(cookies());

    const { data: fiches, error } = await supabase
      .from("fiche1")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (fiches || []).map((f: any) => ({
      numero_fiche: f.numero_fiche,
      annee: f.annee,
      responsable_nom: f.responsable_nom,
      statut: f.statut,
      created_at: f.created_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fiches");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="fiches.xlsx"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur export Excel" }, { status: 500 });
  }
}
