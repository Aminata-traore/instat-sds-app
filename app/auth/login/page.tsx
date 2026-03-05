"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Role = "admin" | "validateur" | "agent" | string;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";

  const goByRole = async () => {
    // ✅ si on a un redirectTo (cas page protégée), on respecte
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    const { data: u, error: eUser } = await supabase.auth.getUser();
    if (eUser) {
      console.error(eUser);
      router.push("/dashboard/fiche1/new");
      return;
    }

    const uid = u.user?.id;
    if (!uid) {
      router.push("/auth/login");
      return;
    }

    const { data: p, error: eProf } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    if (eProf) {
      console.error(eProf);
      router.push("/dashboard/fiche1/new");
      return;
    }

    const role = (p?.role ?? "agent") as Role;

    // ✅ aligné avec ton app
    if (role === "admin" || role === "validateur") {
      router.push("/admin");
      return;
    }

    router.push("/dashboard/fiche1/new");
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (data.session) {
        await goByRole();
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }

    await goByRole();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-instat-gray flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center">Connexion</CardTitle>
          <CardDescription className="text-center">
            Accès sécurisé — INSTAT SDS
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@instat.ml"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="text-instat-lightBlue hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
