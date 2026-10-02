"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const LANGUAGES = [
  "python",
  "java",
  "javascript",
  "typescript",
  "php",
  "html",
  "css",
  "csharp",
];

const cutBR = {
  clipPath:
    "polygon(0 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%)",
};

const inputCls =
  "w-full border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#E2001A] focus:outline-none";

const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500";

export default function NewExercisePage() {
  const router = useRouter();

  const [classes, setClasses] = useState<any[]>([]);
  const [newClasse, setNewClasse] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    classe_id: "",
    mode: "exam" as "review" | "exam",
    language: "python",
    titre: "",
    enonce: "",
  });

  const loadClasses = async () => {
    try {
      setClasses(await api.listClasses());
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const addClasse = async () => {
    if (!newClasse.trim()) return;
    try {
      const created = await api.createClasse(newClasse.trim());
      setNewClasse("");
      setError("");
      await loadClasses();
      if (created?.id) setForm((f) => ({ ...f, classe_id: String(created.id) }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const submit = async () => {
    if (!form.classe_id || !form.titre.trim() || !form.enonce.trim()) {
      setError("Choisis une classe et remplis le titre et l'énoncé.");
      return;
    }
    setSaving(true);
    try {
      await api.createExercise({
        classe_id: Number(form.classe_id),
        mode: form.mode,
        language: form.language,
        titre: form.titre.trim(),
        enonce: form.enonce.trim(),
      });
      router.push("/dashboard/teacher/exercises");
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* ---------- Formulaire principal ---------- */}
        <section className="space-y-6 bg-white p-6 pb-10" style={cutBR}>
          {/* Type */}
          <div>
            <span className={labelCls}>Type d'évaluation</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "exam",
                    title: "Examen",
                    desc: "Noté sur 20 par l'IA.",
                  },
                  {
                    value: "review",
                    title: "Code review",
                    desc: "Feedback pédagogique, sans note.",
                  },
                ] as const
              ).map((m) => {
                const active = form.mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm({ ...form, mode: m.value })}
                    className={`border-2 p-4 text-left transition-colors ${
                      active
                        ? "border-[#E2001A] bg-red-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <p
                      className={`font-display font-semibold ${
                        active ? "text-[#E2001A]" : ""
                      }`}
                    >
                      {m.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Classe + langage */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Classe</label>
              <select
                className={inputCls}
                value={form.classe_id}
                onChange={(e) =>
                  setForm({ ...form, classe_id: e.target.value })
                }
              >
                <option value="">Choisir une classe…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Langage</label>
              <select
                className={inputCls}
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className={labelCls}>Titre</label>
            <input
              className={inputCls}
              placeholder="ex : Factorielle en Java"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
            />
          </div>

          {/* Énoncé */}
          <div>
            <div className="flex items-end justify-between">
              <label className={labelCls}>Énoncé</label>
              <span className="mb-1.5 text-xs text-gray-400">
                {form.enonce.length} caractères
              </span>
            </div>
            <textarea
              className={`${inputCls} min-h-[220px] leading-relaxed`}
              placeholder="Décris précisément ce que l'étudiant doit écrire…"
              value={form.enonce}
              onChange={(e) => setForm({ ...form, enonce: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={submit}
              disabled={saving}
              className="bg-[#E2001A] px-6 py-3 text-sm font-medium text-white hover:bg-[#b80015] disabled:opacity-50"
            >
              {saving ? "Création…" : "Créer l'exercice"}
            </button>
            <Link
              href="/dashboard/teacher/exercises"
              className="border border-gray-300 px-6 py-3 text-sm text-gray-700 hover:bg-[#F6F5F4]"
            >
              Annuler
            </Link>
          </div>
        </section>

        {/* ---------- Classes ---------- */}
        <aside className="space-y-4 bg-[#121212] p-6 pb-10 text-white" style={cutBR}>
          <h2 className="font-display text-lg font-semibold">Mes classes</h2>
          <p className="text-xs text-gray-400">
            La classe que tu n'as pas encore ? Crée-la ici, elle sera
            sélectionnée automatiquement.
          </p>

          <div className="flex gap-2">
            <input
              className="w-full border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#E2001A] focus:outline-none"
              placeholder="ex : 4DS9"
              value={newClasse}
              onChange={(e) => setNewClasse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addClasse()}
            />
            <button
              onClick={addClasse}
              aria-label="Ajouter la classe"
              className="bg-[#E2001A] px-4 text-xl hover:bg-[#b80015]"
            >
              +
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const active = String(c.id) === form.classe_id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm({ ...form, classe_id: String(c.id) })}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-[#E2001A] text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {c.nom}
                </button>
              );
            })}
            {classes.length === 0 && (
              <span className="text-sm text-gray-500">Aucune classe.</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}