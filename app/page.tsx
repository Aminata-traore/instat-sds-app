import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-instat-gray">
      <div className="mx-auto flex min-h-screen max-w-screen-xl items-center px-4">
        <div className="w-full">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-instat-blue text-white grid place-items-center font-extrabold">
                I
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-instat-blue">
                  INSTAT SDS
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Système de Digitalisation des Fiches Statistiques
                </p>
              </div>
            </div>

            <p className="mt-6 text-base text-slate-700">
              Plateforme sécurisée de <span className="font-semibold">saisie</span>,{" "}
              <span className="font-semibold">validation</span> et{" "}
              <span className="font-semibold">suivi</span> des données statistiques de l’INSTAT.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/auth/login">Connexion</Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">Créer un compte</Link>
              </Button>
            </div>

            <div className="mt-6 rounded-xl bg-instat-gray p-4 text-sm text-slate-700">
              <p className="font-semibold text-instat-blue">Accès par rôle</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Agent : saisie et soumission des fiches</li>
                <li>Validateur : validation des fiches soumises</li>
                <li>Admin : gestion des utilisateurs et supervision</li>
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            République du Mali — INSTAT
          </p>
        </div>
      </div>
    </div>
  )
}
