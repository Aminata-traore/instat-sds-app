import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-950 text-white text-2xl font-bold">
            I
          </div>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-950">
              INSTAT SDS
            </h1>
            <p className="mt-1 text-lg text-slate-600">
              Système de Digitalisation des Fiches Statistiques
            </p>
          </div>
        </div>

        <p className="mt-10 text-2xl leading-relaxed text-slate-800">
          Plateforme sécurisée de <strong>saisie</strong>, <strong>validation</strong> et{" "}
          <strong>suivi</strong> des données statistiques.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/auth/login"
            className="rounded-2xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            Connexion
          </Link>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <h2 className="text-lg font-semibold text-slate-800">Accès par rôle</h2>

          <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
            <li>Agent : saisie et soumission des fiches</li>
            <li>Validateur : validation des fiches soumises</li>
            <li>Admin : gestion et supervision</li>
          </ul>
        </div>

        <div className="mt-10 text-center text-sm text-slate-500">
          République du Mali — INSTAT
        </div>
      </div>
    </main>
  );
}
