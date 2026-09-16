"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"etudiant" | "enseignant">("etudiant");
  const [classes, setClasses] = useState<{ id: number; nom: string }[]>([]);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    classe_id: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listClasses().then(setClasses).catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (role === "etudiant" && !form.classe_id) {
      setError("Sélectionne ta classe.");
      return;
    }

    setLoading(true);
    try {
      await api.signup({
        email: form.email,
        password: form.password,
        nom: form.nom,
        prenom: form.prenom,
        role,
        ...(role === "etudiant" ? { classe_id: Number(form.classe_id) } : {}),
      });
      const res = await api.login({ email: form.email, password: form.password });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-esprit-offwhite flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-10">
          <Image src="/esprit-logo.png" alt="ESPRIT" width={190} height={100} className="h-24 w-auto" />
        </Link>

        <div className="bg-white cut-corner p-8 shadow-sm">
          <h1 className="font-display font-semibold text-2xl text-esprit-black">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-esprit-black/60">
            Rejoins la plateforme de correction de code ESPRIT.
          </p>

          {/* Sélecteur de rôle */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["etudiant", "enseignant"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 text-sm font-medium border transition-colors ${
                  role === r
                    ? "bg-esprit-red text-white border-esprit-red"
                    : "border-esprit-black/15 text-esprit-black/70 hover:border-esprit-black"
                }`}
              >
                {r === "etudiant" ? "Étudiant" : "Enseignant"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-esprit-black">Prénom</label>
                <input
                  required
                  value={form.prenom}
                  onChange={(e) => update("prenom", e.target.value)}
                  className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-esprit-black">Nom</label>
                <input
                  required
                  value={form.nom}
                  onChange={(e) => update("nom", e.target.value)}
                  className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
                />
              </div>
            </div>

            {role === "etudiant" && (
              <div>
                <label className="text-sm font-medium text-esprit-black">Classe</label>
                <select
                  required
                  value={form.classe_id}
                  onChange={(e) => update("classe_id", e.target.value)}
                  className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors bg-white"
                >
                  <option value="">— Sélectionne ta classe —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
                {classes.length === 0 && (
                  <p className="mt-1 text-xs text-esprit-black/50">
                    Aucune classe disponible pour l'instant — demande à ton enseignant d'en
                    créer une.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-esprit-black">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
                placeholder="prenom.nom@esprit.tn"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-esprit-black">Mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
              />
              <p className="mt-1 text-xs text-esprit-black/50">8 caractères minimum.</p>
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
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-esprit-black/60">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-esprit-red font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
