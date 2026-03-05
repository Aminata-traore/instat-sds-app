export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export default async function AdminPage() {
  const supabase = supabaseServerClient(cookies());

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profErr) redirect("/dashboard");

  const role = profile?.role ?? "agent";

  // ✅ Admin + Validateur
  if (!["admin", "validateur"].includes(String(role))) redirect("/dashboard");

  // helper: compter selon statut (et gérer si colonne s'appelle "status")
  const countBy = async (col: "statut" | "status", value?: string) => {
    let q = supabase.from("fiche1").select("id", { count: "exact", head: true });
    if (value) q = q.eq(col, value);
    return q;
  };

  // Tentative avec "statut" puis fallback "status"
  let totalFiches = 0;
  let enAttente = 0;
  let totalValide = 0;
  let totalRejete = 0;

  // total
  const t1 = await countBy("statut");
  if (!t1.error) {
    totalFiches = t1.count ?? 0;

    const a1 = await countBy("statut", "soumis");
    enAttente = a1.count ?? 0;

    const v1 = await countBy("statut", "valide");
    totalValide = v1.count ?? 0;

    const r1 = await countBy("statut", "rejete");
    totalRejete = r1.count ?? 0;
  } else {
    // fallback "status"
    const t2 = await countBy("status");
    totalFiches = t2.count ?? 0;

    const a2 = await countBy("status", "soumis");
    enAttente = a2.count ?? 0;

    const v2 = await countBy("status", "valide");
    totalValide = v2.count ?? 0;

    const r2 = await countBy("status", "rejete");
    totalRejete = r2.count ?? 0;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Supervision — Workflow validation Fiche 1
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Connecté en tant que : <span className="font-semibold">{String(role)}</span>
          </p>
        </div>

        {/* ✅ route cohérente avec ton repo: /admin affiche la liste (AdminFiche1Client)
            et chaque fiche a /admin/fiche1/[id] */}
        <Link
          href="/admin"
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Aller à la validation
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiches totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enAttente}</div>
            <p className="text-xs text-muted-foreground mt-1">Statut: soumis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValide}</div>
            <p className="text-xs text-muted-foreground mt-1">Statut: valide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRejete}</div>
            <p className="text-xs text-muted-foreground mt-1">Statut: rejete</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
