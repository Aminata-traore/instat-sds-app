"use client";

import { useState } from "react";

type Props = {
  ficheId: string;
};

export default function SubmitDraftButton({ ficheId }: Props) {
  const [loading, setLoading] = useState(false);

  const submitDraft = async () => {
    if (!confirm("Soumettre cette fiche pour validation ?")) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/fiche1/${ficheId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de la soumission");
      }

      alert("✅ La fiche a été soumise pour validation.");

      // rafraîchir la page
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={submitDraft}
      disabled={loading}
      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Soumission..." : "Soumettre"}
    </button>
  );
}
