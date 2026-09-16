"use client";

import { useEffect, useState } from "react";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { ExportPdfButton } from "@/components/ExportPdfButton";
import { LoadingInline } from "@/components/LoadingScreen";

type Mode = "all" | "review" | "exam";

export default function HistoryPage() {
  const [mode, setMode] = useState<Mode>("all");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .history(mode === "all" ? undefined : mode)
      .then(setSubmissions)
      .finally(() => setLoading(false));
  }, [mode]);

  async function handleSelect(sub: any) {
    setSelected(sub);
    setComparison(null);
    try {
      const comp = await api.compare(sub.id);
      setComparison(comp);
    } catch {
      // Pas de tentative précédente à comparer — ce n'est pas une erreur bloquante.
    }
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <h1 className="font-display font-semibold text-3xl text-esprit-black">Historique</h1>
      <p className="mt-2 text-esprit-black/60">
        Retrouve toutes tes soumissions et compare tes progrès.
      </p>

      <div className="mt-6 flex gap-2">
        {(["all", "review", "exam"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-esprit-red text-white"
                : "bg-white text-esprit-black/70 border border-esprit-black/15 hover:border-esprit-black"
            }`}
          >
            {m === "all" ? "Tout" : m === "review" ? "Code Review" : "Examens"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid md:grid-cols-[1fr_1.2fr] gap-6">
        {/* Liste */}
        <div className="space-y-2">
          {loading && <LoadingInline label="Chargement de l'historique..." />}
          {!loading && submissions.length === 0 && (
            <p className="text-esprit-black/50 text-sm">
              Aucune soumission pour l'instant. Lance ta première analyse !
            </p>
          )}
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSelect(sub)}
              className={`w-full text-left bg-white p-4 flex items-center justify-between gap-3 border-l-4 transition-colors ${
                selected?.id === sub.id ? "border-esprit-red" : "border-transparent hover:border-esprit-gray-light"
              }`}
            >
              <div>
                <p className="font-medium text-sm text-esprit-black line-clamp-1">
                  {sub.enonce}
                </p>
                <p className="text-xs text-esprit-black/50 mt-1">
                  {sub.language} · {sub.mode === "exam" ? "Examen" : "Review"} ·{" "}
                  {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {sub.note != null && (
                  <span className="text-sm font-display font-semibold text-esprit-red">
                    {sub.note}/20
                  </span>
                )}
                <ChevronRight size={16} className="text-esprit-black/30" />
              </div>
            </button>
          ))}
        </div>

        {/* Détail + comparaison */}
        <div className="bg-white cut-corner p-6">
          {!selected && (
            <p className="text-esprit-black/50 text-sm">
              Sélectionne une soumission pour voir le détail et la comparer à la précédente.
            </p>
          )}
          {selected && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-semibold text-lg text-esprit-black">
                    {selected.mode === "exam" ? "Mode Examen" : "Code Review"}
                  </h2>
                  <p className="text-xs text-esprit-black/50 mt-1">
                    {new Date(selected.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <ExportPdfButton
                  enonce={selected.enonce}
                  code={selected.code}
                  language={selected.language}
                  mode={selected.mode}
                  feedback={selected.feedback}
                  note={selected.note}
                />
              </div>

              {comparison && (
                <div className="mt-5 pt-5 border-t border-esprit-black/10">
                  <p className="text-sm font-medium text-esprit-black mb-3">
                    Comparaison avec la tentative précédente
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricDelta
                      label="Note"
                      current={comparison.current.note}
                      previous={comparison.previous.note}
                      unit="/20"
                      higherIsBetter
                    />
                    <MetricDelta
                      label="Bugs Sonar"
                      current={comparison.current.sonar_bugs}
                      previous={comparison.previous.sonar_bugs}
                      higherIsBetter={false}
                    />
                    <MetricDelta
                      label="Code smells"
                      current={comparison.current.sonar_code_smells}
                      previous={comparison.previous.sonar_code_smells}
                      higherIsBetter={false}
                    />
                    <MetricDelta
                      label="Lignes de code"
                      current={comparison.current.num_lines}
                      previous={comparison.previous.num_lines}
                      neutral
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-esprit-black/10">
                <p className="text-sm font-medium text-esprit-black mb-2">Feedback</p>
                <div className="text-sm text-esprit-black/80 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {selected.feedback}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricDelta({
  label,
  current,
  previous,
  unit = "",
  higherIsBetter,
  neutral = false,
}: {
  label: string;
  current: number | null;
  previous: number | null;
  unit?: string;
  higherIsBetter?: boolean;
  neutral?: boolean;
}) {
  if (current == null || previous == null) {
    return (
      <div className="bg-esprit-offwhite p-3">
        <p className="text-xs text-esprit-black/50">{label}</p>
        <p className="text-sm font-medium text-esprit-black/40 mt-1">—</p>
      </div>
    );
  }

  const diff = current - previous;
  const improved = neutral ? null : higherIsBetter ? diff > 0 : diff < 0;
  const worsened = neutral ? null : higherIsBetter ? diff < 0 : diff > 0;

  return (
    <div className="bg-esprit-offwhite p-3">
      <p className="text-xs text-esprit-black/50">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm font-display font-semibold text-esprit-black">
          {current}
          {unit}
        </p>
        {diff !== 0 && !neutral && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              improved ? "text-green-600" : worsened ? "text-esprit-red" : "text-esprit-black/40"
            }`}
          >
            {improved ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        )}
        {(diff === 0 || neutral) && (
          <span className="inline-flex items-center text-xs text-esprit-black/40">
            <Minus size={12} />
          </span>
        )}
      </div>
    </div>
  );
}
