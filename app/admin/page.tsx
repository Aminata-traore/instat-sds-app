export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, ClipboardList } from "lucide-react";

export default async function AdminPage() {
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

  // Admin only (tu peux élargir à validateur si tu veux)
  if (profile?.role !== "admin") redirect("/dashboard");

  const { count: totalFiches } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true });

  const { count: enAttente } = await supabase
    .from("fiche1")
    .select("id", { count: "exact", head: true })
    .eq("statut", "soumis");

  const { count: totalLignes } = await supabase
    .from("fiche1_activites")
    .select("id", { count: "exact", head: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-instat-blue">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Supervision — Fiche 1 (bilan N-1)
          </p>
        </div>

        <Link
          href="/admin/fiche1"
          className="rounded-xl bg-instat-blue px-4 py-2 text-sm font-semibold text-white"
        >
          Aller à la validation
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiches totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiches ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enAttente ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes activités</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLignes ?? 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
