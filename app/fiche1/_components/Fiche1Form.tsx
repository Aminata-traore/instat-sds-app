"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

type Variant = "create" | "edit";

type Props = {
  variant: Variant;
  id?: string; // requis si edit
  onSaved?: (id: string) => void;
};

export function Fiche1Form({ variant, id, onSaved }: Props) {
  const isEdit = variant === "edit";

  const [titre, setTitre] = useState("");
  const [annee, setAnnee] = useState<number | "">("");
  const [numeroFiche, setNumeroFiche] = useState("");
  const [statut, setStatut] = useState<"brouillon" | "soumis">("brouillon");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return titre.trim().length > 0;
  }, [titre]);

  // Charger la fiche en mode edit
  useEffect(() => {
    if (!isEdit) return;
    if (!id) {
      setErr("ID manquant pour l’édition.");
      return;
    }

    let alive = true;

    (async () => {
      try {
        setErr(null);
        setMsg(null);
        setBusy(true);

        const supabase = supabaseClient();
        const { data, error } = await supabase
          .from("answers_fiche1")
          .select("titre, annee, numero_fiche, statut")
          .eq("id", id)
          .single();

        if (error) throw new Error(error.message);
        if (!alive) return;

        setTitre(data?.titre ?? "");
        setAnnee(data?.annee ?? "");
        setNumeroFiche(data?.numero_fiche ?? "");
        setStatut((data?.statut ?? "brouillon") as any);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Erreur chargement fiche");
      } finally {
        if (alive) setBusy(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isEdit, id]);

  const save = async () => {
    setErr(null);
    setMsg(null);

    if (!canSave) {
      setErr("Le titre est obligatoire.");
      return;
    }

    setBusy(true);

    try {
      const supabase = supabaseClient();

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error(userErr.message);
      if (!userData.user) throw new Error("Utilisateur non connecté.");

      const payload = {
        titre: titre.trim(),
        annee: annee === "" ? null : Number(annee),
        numero_fiche: numeroFiche.trim() || null,
        statut,
        // data: {...}  // tu peux mettre ici ton JSON complet plus tard
      };

      if (isEdit) {
        if (!id) throw new Error("ID manquant pour l’édition.");

        const { error } = await supabase.from("answers_fiche1").update(payload).eq("id", id);
        if (error) throw new Error(error.message);

        setMsg("Modifications enregistrées.");
        onSaved?.(id);
      } else {
        const { data, error } = await supabase
          .from("answers_fiche1")
          .insert({
            ...payload,
            user_id: userData.user.id // si ta table a user_id
          })
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        if (!data?.id) throw new Error("ID non retourné après insertion.");

        setMsg("Fiche enregistrée.");
        onSaved?.(data.id);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold">
          Formulaire Fiche 1 ({variant === "create" ? "nouvelle" : "édition"})
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          Remplis au minimum le titre puis enregistre. Ensuite on ajoutera tous les champs INSTAT.
        </p>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}
      {msg && !err && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {msg}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Titre *</label>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Ex: Activité 2026 / Région…"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Année</label>
          <input
            value={annee}
            onChange={(e) => {
              const v = e.target.value;
              setAnnee(v === "" ? "" : Number(v));
            }}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Ex: 2026"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">N° fiche</label>
          <input
            value={numeroFiche}
            onChange={(e) => setNumeroFiche(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="Ex: F1-00012"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Statut</label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as any)}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="brouillon">Brouillon</option>
            <option value="soumis">Soumis</option>
          </select>
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy || !canSave}
        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}
