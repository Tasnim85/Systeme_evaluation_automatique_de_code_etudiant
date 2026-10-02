"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ExportPdfButton } from "./ExportPdfButton";
import { LoadingScreen } from "./LoadingScreen";
import { FeedbackView } from "./FeedbackView";

interface Exercise {
  id: number;
  titre: string;
  language: string;
  enonce: string;
}

interface Props {
  mode: "review" | "exam";
}

const ANALYZING_MESSAGES = [
  "Analyse du code en cours...",
  "Vérification de la qualité...",
  "Recherche des critères pédagogiques...",
  "Génération du feedback...",
];

export function SubmissionWorkspace({ mode }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    api
      .exercisesForMode(mode)
      .then((list: Exercise[]) => {
        setExercises(list);
        if (list.length > 0) setSelectedExercise(list[0]);
      })
      .finally(() => setLoadingExercises(false));
  }, [mode]);

  // Fait défiler le message affiché sur l'écran de chargement pendant
  // l'analyse, pour que l'attente (potentiellement longue selon le
  // langage) paraisse moins statique.
  useEffect(() => {
    if (!loading) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % ANALYZING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCode(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExercise) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await api.evaluate({ exercise_id: selectedExercise.id, code });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue pendant l'analyse.");
    } finally {
      setLoading(false);
    }
  }

  const accentBg = mode === "exam" ? "bg-esprit-red" : "bg-esprit-charcoal";

  return (
    <div className="p-8 md:p-12 max-w-4xl">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingScreen message={ANALYZING_MESSAGES[messageIndex]} overlay />
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="font-display font-semibold text-3xl text-esprit-black">
        {mode === "exam" ? "Mode Examen" : "Code Review"}
      </h1>
      <p className="mt-2 text-esprit-black/60">
        {mode === "exam"
          ? "Ton code sera noté sur 20, comme en conditions réelles."
          : "Feedback détaillé, sans note — entraîne-toi librement."}
      </p>

      {loadingExercises && (
        <p className="mt-8 text-sm text-esprit-black/50">Chargement des exercices...</p>
      )}

      {!loadingExercises && exercises.length === 0 && (
        <div className="mt-8 bg-white cut-corner p-6 text-sm text-esprit-black/60">
          Aucun exercice {mode === "exam" ? "d'examen" : "de code review"} n'a encore été
          assigné à ta classe. Reviens plus tard ou contacte ton enseignant.
        </div>
      )}

      {!loadingExercises && exercises.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-esprit-black">Exercice</label>
            <select
              value={selectedExercise?.id}
              onChange={(e) =>
                setSelectedExercise(
                  exercises.find((ex) => ex.id === Number(e.target.value)) || null
                )
              }
              className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors bg-white"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.titre} — {ex.language}
                </option>
              ))}
            </select>
          </div>

          {selectedExercise && (
            <motion.div
              key={selectedExercise.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-esprit-offwhite border-l-4 border-esprit-red p-4"
            >
              <p className="text-xs font-medium text-esprit-black/50 mb-1">
                ÉNONCÉ · {selectedExercise.language}
              </p>
              <p className="text-sm text-esprit-black/85 leading-relaxed whitespace-pre-wrap">
                {selectedExercise.enonce}
              </p>
            </motion.div>
          )}

          <div className="flex justify-end">
            <label className="flex items-center gap-2 px-4 py-2 border border-esprit-black/20 cursor-pointer hover:border-esprit-black transition-colors text-sm font-medium">
              <Upload size={16} />
              Importer un fichier
              <input type="file" onChange={handleFileImport} className="hidden" />
            </label>
          </div>

          <div>
            <label className="text-sm font-medium text-esprit-black">Code</label>
            <textarea
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              placeholder="Colle ton code ici, ou importe un fichier ci-dessus."
              className="mt-1 w-full border border-esprit-black/15 px-3 py-3 font-mono text-sm focus:border-esprit-red outline-none transition-colors resize-y"
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
            className={`inline-flex items-center gap-2 px-6 py-3 text-white font-medium cut-corner-sm transition-opacity disabled:opacity-60 ${accentBg}`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Analyse en cours...
              </>
            ) : (
              "Analyser mon code"
            )}
          </button>
        </form>
      )}

      {result && selectedExercise && (
        <div className="mt-12 border-t border-esprit-black/10 pt-8">
          <h2 className="mb-5 font-display font-semibold text-2xl text-esprit-black">
            Feedback
          </h2>
          <FeedbackView
            feedback={result.feedback}
            note={result.note}
            mode={mode}
            metrics={result.static_metrics}
            actions={
              <ExportPdfButton
                enonce={selectedExercise.enonce}
                code={code}
                language={selectedExercise.language}
                mode={mode}
                feedback={result.feedback}
                note={result.note}
              />
            }
          />
        </div>
      )}
    </div>
  );
}