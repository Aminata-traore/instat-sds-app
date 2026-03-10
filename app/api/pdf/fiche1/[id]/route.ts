import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServerClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServerClient(cookies());

    const { data: fiche } = await supabase
      .from("fiche1")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!fiche) {
      return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
    }

    const { data: answers } = await supabase
      .from("answers_fiche1")
      .select("*")
      .eq("fiche1_id", params.id)
      .order("question_code", { ascending: true });

    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(16);
    doc.text("INSTAT - Fiche statistique", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Numéro fiche : ${fiche.numero_fiche ?? "-"}`, 14, y);
    y += 7;
    doc.text(`Année : ${fiche.annee ?? "-"}`, 14, y);
    y += 7;
    doc.text(`Responsable : ${fiche.responsable_nom ?? "-"}`, 14, y);
    y += 7;
    doc.text(`Statut : ${fiche.statut ?? "-"}`, 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Réponses", 14, y);
    y += 8;

    doc.setFontSize(10);

    for (const a of answers || []) {
      const value =
        a.value_text ??
        a.value_number?.toString() ??
        a.value_bool?.toString() ??
        JSON.stringify(a.value_json ?? "");

      const line = `${a.question_code} : ${value}`;
      const lines = doc.splitTextToSize(line, 180);

      doc.text(lines, 14, y);
      y += lines.length * 6;

      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    }

    const pdf = doc.output("arraybuffer");

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="fiche-${fiche.numero_fiche || fiche.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur PDF" }, { status: 500 });
  }
}
