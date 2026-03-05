"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { supabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = useMemo(() => supabaseClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // ✅ Si session dispo tout de suite, on crée le profil (sinon, il sera créé côté DB via trigger si tu en as un)
    const uid = data.user?.id

    if (uid) {
      // On tente upsert (si déjà créé par trigger -> pas d'erreur)
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: uid,
        full_name: fullName,
        role: "agent",
      })

      // On ne bloque pas l'utilisateur si ça échoue (selon ta config RLS)
      if (profErr) {
        console.warn("profiles upsert error:", profErr.message)
      }
    }

    // ✅ Pour rester aligné projet: retour login (ou direct saisie si email confirmation off)
    router.push("/auth/login?message=Compte créé. Connectez-vous pour saisir la Fiche 1.")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-instat-gray flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Inscription — INSTAT SDS
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Votre nom"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@instat.ml"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" loading={loading}>
              S&apos;inscrire
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-instat-lightBlue hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
