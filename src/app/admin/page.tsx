"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/produits");
      router.refresh();
    } else {
      setError("Mot de passe incorrect.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-3xl border border-border-subtle bg-surface p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-red-50 text-brand-red-600">
          <Lock size={22} />
        </div>
        <h1 className="text-center font-display text-xl font-extrabold text-stone-900">
          Espace administration
        </h1>
        <p className="mb-6 text-center text-sm text-stone-500">
          Gérez le catalogue de Ô Bon Prix.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="rounded-full border border-border-subtle px-4 py-3 text-sm outline-none focus:border-brand-red-400 focus:ring-2 focus:ring-brand-red-100"
            autoFocus
          />
          {error && <p className="text-center text-sm text-brand-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-red-500 py-3 font-semibold text-white transition hover:bg-brand-red-600 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
