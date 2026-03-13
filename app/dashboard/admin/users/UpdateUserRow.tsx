"use client";

import { useState } from "react";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default function UpdateUserRow({
  user,
  currentAdminId,
}: {
  user: UserRow;
  currentAdminId: string;
}) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role,
          is_active: isActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erreur mise à jour");
      }

      alert("✅ Utilisateur mis à jour.");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const isMe = user.id === currentAdminId;

  return (
    <tr className="border-b align-top">
      <td className="p-3">{user.full_name || "-"}</td>
      <td className="p-3">{user.email || "-"}</td>
      <td className="p-3">
        <select
          className="rounded-lg border px-2 py-1"
          value={role}
          disabled={isMe}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="agent">agent</option>
          <option value="validateur">validateur</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td className="p-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            disabled={isMe}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>{isActive ? "Actif" : "Désactivé"}</span>
        </label>
      </td>
      <td className="p-3">
        <button
          type="button"
          disabled={loading || isMe}
          onClick={save}
          className="rounded-lg border px-3 py-1 font-medium disabled:opacity-50"
        >
          {loading ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </td>
    </tr>
  );
}
