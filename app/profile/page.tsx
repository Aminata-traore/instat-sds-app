"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { useRequireAuth } from "@/lib/auth/requireAuth";
import { AppShell } from "@/app/_components/AppShell";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const { loading } = useRequireAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr(null);

      const { data: u, error: eUser } = await supabase.auth.getUser();
      if (eUser) {
        if (!alive) return;
        setErr(eUser.message);
        return;
      }

      const uid = u.user?.id;
      if (!uid) {
        router.replace("/auth/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,created_at")
        .eq("id", uid)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        setErr(error.message);
        return;
      }

      setProfile((data as Profile) ?? null);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (loading) return <main className="p-6">Chargement...</main>;

  return (
    <AppShell title="Mon profil">
      <div className="max-w-2xl">
        {err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Erreur lors du chargement du profil : {err}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium">{profile?.full_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile?.email || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="font-medium">
                {profile?.role === "agent"
                  ? "Agent de saisie"
                  : profile?.role === "validateur"
                  ? "Validateur"
                  : profile?.role === "admin"
                  ? "Administrateur"
                  : profile?.role || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Membre depuis</p>
              <p className="font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("fr-FR")
                  : "-"}
              </p>
            </div>

            <div className="pt-4">
              <Button asChild variant="outline">
                <Link href="/auth/change-password">
                  Changer le mot de passe
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {!err && !profile && (
          <div className="mt-4 rounded-md border bg-yellow-50 p-4 text-sm text-yellow-800">
            ⚠️ Profil non trouvé dans la table <b>profiles</b>.
          </div>
        )}
      </div>
    </AppShell>
  );
}
