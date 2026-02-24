"use client";

import { useState } from "react";

export function Fiche1Form({
  variant,
  onSaved,
}: {
  variant: "create" | "edit";
  onSaved?: (id: string) => void;
}) {
  const [title, setTitle] = useState("");

  const save = async () => {
    // version minimal: on simule un id
    const fakeId = "demo-" + Date.now();
    onSaved?.(fakeId);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4">
        <div className="text-sm font-semibold">Formulaire Fiche 1 ({variant})</div>
        <p className="mt-1 text-sm text-neutral-600">
          Version minimale pour débloquer le build. On ajoutera ensuite tous les champs.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold">Titre</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Ex: Activité 2026 / Région..."
        />
      </div>

      <button
        onClick={save}
        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Enregistrer
      </button>
    </div>
  );
}
