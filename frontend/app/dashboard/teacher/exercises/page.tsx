"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const cutBR = {
  clipPath:
    "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
};

type ModeFilter = "all" | "exam" | "review";

export default function TeacherExercisesListPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [classe, setClasse] = useState("all");
  const [mode, setMode] = useState<ModeFilter>("all");

  useEffect(() => {
    api
      .myExercises()
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const classes = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.classe))).sort(),
    [exercises]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        (classe === "all" || e.classe === classe) &&
        (mode === "all" || e.mode === mode) &&
        (!q || `${e.titre} ${e.language}`.toLowerCase().includes(q))
    );
  }, [exercises, search, classe, mode]);

  const totalSubs = exercises.reduce((n, e) => n + (e.nb_submissions ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* ---------- En-tête ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Mes exercices</h1>
          <p className="mt-2 text-gray-500">
            {exercises.length} exercice(s) · {totalSubs} soumission(s) reçues
          </p>
        </div>
        <Link
          href="/dashboard/teacher/exercises/new"
          className="inline-flex items-center gap-2 bg-[#E2001A] px-5 py-3 text-sm font-medium text-white hover:bg-[#b80015]"
        >
          <span className="text-lg leading-none">+</span> Nouvel exercice
        </Link>
      </header>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ---------- Filtres ---------- */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un exercice…"
          className="w-full max-w-xs border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#E2001A] focus:outline-none"
        />

        <select
          value={classe}
          onChange={(e) => setClasse(e.target.value)}
          className="border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#E2001A] focus:outline-none"
        >
          <option value="all">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex bg-white">
          {(
            [
              ["all", "Tous"],
              ["exam", "Examen"],
              ["review", "Review"],
            ] as [ModeFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`px-4 py-2 text-sm transition-colors ${
                mode === value
                  ? "bg-[#121212] text-white"
                  : "text-gray-600 hover:bg-[#F6F5F4]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Liste ---------- */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white px-6 py-16 text-center" style={cutBR}>
          <p className="font-display text-lg font-semibold">
            {exercises.length === 0
              ? "Aucun exercice pour l'instant"
              : "Aucun résultat"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {exercises.length === 0
              ? "Crée ton premier exercice pour qu'il apparaisse ici."
              : "Essaie de modifier les filtres."}
          </p>
          {exercises.length === 0 && (
            <Link
              href="/dashboard/teacher/exercises/new"
              className="mt-5 inline-block bg-[#E2001A] px-5 py-2.5 text-sm text-white hover:bg-[#b80015]"
            >
              Créer un exercice
            </Link>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2">
          {filtered.map((ex) => {
            const isOpen = openId === ex.id;
            const isExam = ex.mode === "exam";
            return (
              <article
                key={ex.id}
                className="flex flex-col bg-white p-5 pb-8"
                style={cutBR}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold leading-tight">
                    {ex.titre}
                  </h2>
                  <span
                    className={`shrink-0 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ${
                      isExam ? "bg-[#E2001A]" : "bg-[#121212]"
                    }`}
                  >
                    {isExam ? "Examen" : "Review"}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-[#F6F5F4] px-2.5 py-1 text-gray-600">
                    {ex.classe}
                  </span>
                  <span className="bg-[#F6F5F4] px-2.5 py-1 text-gray-600">
                    {ex.language}
                  </span>
                  <span className="px-1 py-1 text-gray-400">
                    {new Date(ex.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                {isOpen && (
                  <p className="mt-4 max-h-60 overflow-auto whitespace-pre-wrap break-words border-l-4 border-[#E2001A] bg-[#F6F5F4] p-3 text-sm text-gray-700">
                    {ex.enonce || "Aucun énoncé."}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <button
                    onClick={() => setOpenId(isOpen ? null : ex.id)}
                    className="text-sm text-gray-600 underline-offset-2 hover:text-[#E2001A] hover:underline"
                  >
                    {isOpen ? "Masquer l'énoncé" : "Voir l'énoncé"}
                  </button>

                  <Link
                    href={`/dashboard/teacher/exercises/${ex.id}/submissions`}
                    className="inline-flex items-center gap-2 bg-[#121212] px-4 py-2 text-sm text-white hover:bg-[#E2001A]"
                  >
                    Soumissions
                    <span className="bg-white/20 px-1.5 text-xs">
                      {ex.nb_submissions ?? 0}
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}