"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-esprit-offwhite flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-10">
          <Image src="/esprit-logo.png" alt="ESPRIT" width={190} height={100} className="h-24 w-auto" />
        </Link>

        <div className="bg-white cut-corner p-8 shadow-sm">
          <h1 className="font-display font-semibold text-2xl text-esprit-black">
            Se connecter
          </h1>
          <p className="mt-1 text-sm text-esprit-black/60">
            Accède à ton espace de correction de code.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-esprit-black">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
                placeholder="prenom.nom@esprit.tn"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-esprit-black">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-esprit-red" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-esprit-red text-white font-medium cut-corner-sm hover:bg-esprit-red-dark transition-colors disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-esprit-black/60">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-esprit-red font-medium">
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
