"use client";

import { useState } from "react";

export default function CreateUserForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "validateur">("agent");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, role, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erreur création utilisateur");
      }

      alert("✅ Compte créé avec succès.");
      setFullName("");
      setEmail("");
      setRole("agent");
      setPassword("");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Créer un compte</h2>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nom complet</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-xl border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Rôle</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as "agent" | "validateur")}
          >
            <option value="agent">agent</option>
            <option value="validateur">validateur</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Mot de passe temporaire</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-black px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}
