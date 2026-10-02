"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const cutBR = {
  clipPath:
    "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
};

function noteStyle(note: number | null) {
  if (note === null) return "bg-gray-100 text-gray-500";
  if (note >= 14) return "bg-emerald-100 text-emerald-700";
  if (note >= 10) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-[#E2001A]";
}

function initials(prenom: string, nom: string) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
}

export default function ExerciseSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastOnly, setLastOnly] = useState(false);

  useEffect(() => {
    api
      .exerciseSubmissions(Number(id))
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  const openDetail = async (submissionId: number) => {
    setLoadingDetail(submissionId);
    try {
      setDetail(await api.submissionDetail(submissionId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingDetail(null);
    }
  };

  // Fermer le panneau avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    let list: any[] = data.submissions;

    if (lastOnly) {
      // La liste est triée du plus récent au plus ancien :
      // on garde la première occurrence de chaque étudiant.
      const seen = new Set<number>();
      list = list.filter((s) => {
        if (seen.has(s.student.id)) return false;
        seen.add(s.student.id);
        return true;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        `${s.student.prenom} ${s.student.nom} ${s.student.email}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [data, search, lastOnly]);

  if (error && !data)
    return (
      <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );

  if (!data)
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-gray-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse bg-gray-200" />
      </div>
    );

  const { exercise, stats } = data;
  const isExam = exercise.mode === "exam";

  return (
    <div className="space-y-8">
      {/* ---------- En-tête ---------- */}
      <header className="space-y-3">
        <Link
          href="/dashboard/teacher/exercises"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#E2001A]"
        >
          ← Mes exercices
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{exercise.titre}</h1>
          <span
            className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
              isExam ? "bg-[#E2001A] text-white" : "bg-[#121212] text-white"
            }`}
          >
            {isExam ? "Examen" : "Review"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="bg-white px-3 py-1 text-gray-600">
            Classe {exercise.classe}
          </span>
          <span className="bg-white px-3 py-1 text-gray-600">
            {exercise.language}
          </span>
        </div>
      </header>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ---------- Statistiques ---------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Soumissions" value={stats.total} />
        <StatCard label="Étudiants" value={stats.etudiants} />
        <StatCard
          label="Moyenne"
          value={stats.moyenne !== null ? `${stats.moyenne}/20` : "—"}
          accent
        />
      </div>

      {/* ---------- Tableau ---------- */}
      <section className="bg-white" style={cutBR}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un étudiant…"
            className="w-full max-w-xs border border-gray-300 px-3 py-2 text-sm focus:border-[#E2001A] focus:outline-none"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={lastOnly}
              onChange={(e) => setLastOnly(e.target.checked)}
              className="h-4 w-4 accent-[#E2001A]"
            />
            Dernière tentative seulement
          </label>
        </div>

        <div className="overflow-x-auto pb-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 font-medium">Étudiant</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className="transition-colors hover:bg-[#F6F5F4]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#121212] text-xs font-semibold text-white">
                        {initials(s.student.prenom, s.student.nom)}
                      </span>
                      <div>
                        <p className="font-medium">
                          {s.student.prenom} {s.student.nom}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.student.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(s.created_at).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-semibold ${noteStyle(
                        s.note
                      )}`}
                    >
                      {s.note !== null ? `${s.note}/20` : "Non noté"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openDetail(s.id)}
                      disabled={loadingDetail === s.id}
                      className="bg-[#121212] px-4 py-1.5 text-xs text-white hover:bg-[#E2001A] disabled:opacity-50"
                    >
                      {loadingDetail === s.id ? "…" : "Voir"}
                    </button>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-14 text-center text-gray-400"
                  >
                    {data.submissions.length === 0
                      ? "Aucune soumission pour l'instant."
                      : "Aucun résultat."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Panneau latéral de détail ---------- */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          />
          <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#F6F5F4] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-[#121212] p-5 text-white">
              <div>
                <p className="font-display text-xl font-semibold">
                  {detail.student.prenom} {detail.student.nom}
                </p>
                <p className="text-xs text-gray-400">
                  {detail.student.email} ·{" "}
                  {new Date(detail.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-sm font-semibold ${noteStyle(
                    detail.note
                  )}`}
                >
                  {detail.note !== null ? `${detail.note}/20` : "Non noté"}
                </span>
                <button
                  onClick={() => setDetail(null)}
                  aria-label="Fermer"
                  className="text-2xl leading-none text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6 p-5">
              {/* Métriques */}
              {detail.static_metrics && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <Chip label="Lignes" value={detail.static_metrics.num_lines} />
                  <Chip
                    label="Fonctions"
                    value={detail.static_metrics.num_functions}
                  />
                  {detail.static_metrics.sonar_bugs !== undefined && (
                    <>
                      <Chip
                        label="Bugs"
                        value={detail.static_metrics.sonar_bugs}
                        danger={detail.static_metrics.sonar_bugs > 0}
                      />
                      <Chip
                        label="Vulnérabilités"
                        value={detail.static_metrics.sonar_vulnerabilities}
                        danger={detail.static_metrics.sonar_vulnerabilities > 0}
                      />
                      <Chip
                        label="Code smells"
                        value={detail.static_metrics.sonar_code_smells}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Code */}
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Code soumis
                </h3>
                <pre
                  className="max-h-[360px] overflow-auto bg-[#1E1E1E] p-4 text-xs leading-relaxed text-gray-100"
                  style={cutBR}
                >
                  {detail.code}
                </pre>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Feedback généré
                </h3>
                <div className="whitespace-pre-wrap border-l-4 border-[#E2001A] bg-white p-4 text-sm leading-relaxed text-gray-800">
                  {detail.feedback}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-5 ${
        accent ? "bg-[#E2001A] text-white" : "bg-white text-[#121212]"
      }`}
      style={cutBR}
    >
      <p
        className={`text-xs uppercase tracking-wide ${
          accent ? "text-white/80" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Chip({
  label,
  value,
  danger,
}: {
  label: string;
  value: number | undefined;
  danger?: boolean;
}) {
  if (value === undefined || value === null) return null;
  return (
    <span
      className={`px-3 py-1.5 ${
        danger ? "bg-red-100 text-[#E2001A]" : "bg-white text-gray-600"
      }`}
    >
      {label} : <strong>{value}</strong>
    </span>
  );
}