"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java (+ Spring)" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript (+ Angular)" },
  { value: "php", label: "PHP (+ Symfony)" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "csharp", label: "C# (.NET)" },
];

export default function TeacherExercisesPage() {
  const [classes, setClasses] = useState<{ id: number; nom: string }[]>([]);
  const [myExercises, setMyExercises] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newClasseName, setNewClasseName] = useState("");
  const [classeError, setClasseError] = useState<string | null>(null);
  const [creatingClasse, setCreatingClasse] = useState(false);

  const [exerciseForm, setExerciseForm] = useState({
    classe_id: "",
    mode: "review" as "review" | "exam",
    language: "python",
    titre: "",
    enonce: "",
  });
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function loadData() {
    api.listClasses().then(setClasses);
    api.myExercises().then(setMyExercises);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateClasse(e: React.FormEvent) {
    e.preventDefault();
    setClasseError(null);
    setCreatingClasse(true);
    try {
      await api.createClasse(newClasseName);
      setNewClasseName("");
      loadData();
    } catch (err: any) {
      setClasseError(err.message);
    } finally {
      setCreatingClasse(false);
    }
  }

  async function handleCreateExercise(e: React.FormEvent) {
    e.preventDefault();
    setExerciseError(null);
    setSuccessMessage(null);
    if (!exerciseForm.classe_id) {
      setExerciseError("Sélectionne une classe.");
      return;
    }
    setCreatingExercise(true);
    try {
      const created = await api.createExercise({
        ...exerciseForm,
        classe_id: Number(exerciseForm.classe_id),
      });
      setSuccessMessage("Exercice créé et assigné avec succès.");
      setExerciseForm((f) => ({ ...f, titre: "", enonce: "" }));
      api.myExercises().then((list) => {
        setMyExercises(list);
        setExpandedId(created.id); // déplie l'exercice qu'on vient de créer
      });
      api.listClasses().then(setClasses);
    } catch (err: any) {
      setExerciseError(err.message);
    } finally {
      setCreatingExercise(false);
    }
  }

  return (
    <div className="p-8 md:p-12 max-w-5xl">
      <h1 className="font-display font-semibold text-3xl text-esprit-black">
        Gérer mes exercices
      </h1>
      <p className="mt-2 text-esprit-black/60">
        Crée des classes et assigne des exercices de code review ou d'examen.
      </p>

      <div className="mt-10 grid md:grid-cols-2 gap-8">
        {/* Créer une classe */}
        <div className="bg-white cut-corner p-6">
          <h2 className="font-display font-semibold text-lg text-esprit-black">
            Créer une classe
          </h2>
          <form onSubmit={handleCreateClasse} className="mt-4 flex gap-2">
            <input
              required
              value={newClasseName}
              onChange={(e) => setNewClasseName(e.target.value)}
              placeholder="ex: 4DS9"
              className="flex-1 border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={creatingClasse}
              className="px-4 py-2 bg-esprit-red text-white font-medium cut-corner-sm hover:bg-esprit-red-dark transition-colors disabled:opacity-60"
            >
              <Plus size={18} />
            </button>
          </form>
          {classeError && <p className="mt-2 text-sm text-esprit-red">{classeError}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {classes.map((c) => (
              <span key={c.id} className="px-3 py-1 bg-esprit-offwhite text-sm text-esprit-black/70">
                {c.nom}
              </span>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-esprit-black/40">Aucune classe créée pour l'instant.</p>
            )}
          </div>
        </div>

        {/* Mes exercices */}
        <div className="bg-white cut-corner p-6">
          <h2 className="font-display font-semibold text-lg text-esprit-black">
            Mes exercices
          </h2>
          <div className="mt-4 space-y-1 max-h-80 overflow-y-auto">
            {myExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                className="w-full text-left text-sm py-2 border-b border-esprit-black/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-esprit-black">{ex.titre}</p>
                    <p className="text-xs text-esprit-black/50">
                      {ex.classe} · {ex.language} · {ex.mode === "exam" ? "Examen" : "Review"}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-esprit-black/30 transition-transform ${
                      expandedId === ex.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedId === ex.id && (
                  <p className="mt-2 text-esprit-black/70 leading-relaxed bg-esprit-offwhite p-3">
                    {ex.enonce}
                  </p>
                )}
              </button>
            ))}
            {myExercises.length === 0 && (
              <p className="text-sm text-esprit-black/40">Aucun exercice créé pour l'instant.</p>
            )}
          </div>
        </div>
      </div>

      {/* Créer un exercice */}
      <div className="mt-8 bg-white cut-corner p-6">
        <h2 className="font-display font-semibold text-lg text-esprit-black">
          Créer un exercice
        </h2>
        <form onSubmit={handleCreateExercise} className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-esprit-black">Classe</label>
              <select
                value={exerciseForm.classe_id}
                onChange={(e) => setExerciseForm((f) => ({ ...f, classe_id: e.target.value }))}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 bg-white focus:border-esprit-red outline-none"
              >
                <option value="">— Choisir —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-esprit-black">Mode</label>
              <select
                value={exerciseForm.mode}
                onChange={(e) =>
                  setExerciseForm((f) => ({ ...f, mode: e.target.value as "review" | "exam" }))
                }
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 bg-white focus:border-esprit-red outline-none"
              >
                <option value="review">Code Review</option>
                <option value="exam">Examen</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-esprit-black">Langage</label>
              <select
                value={exerciseForm.language}
                onChange={(e) => setExerciseForm((f) => ({ ...f, language: e.target.value }))}
                className="mt-1 w-full border border-esprit-black/15 px-3 py-2 bg-white focus:border-esprit-red outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-esprit-black">Titre</label>
            <input
              required
              value={exerciseForm.titre}
              onChange={(e) => setExerciseForm((f) => ({ ...f, titre: e.target.value }))}
              placeholder="ex: Calcul de factorielle"
              className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-esprit-black">Énoncé</label>
            <textarea
              required
              rows={4}
              value={exerciseForm.enonce}
              onChange={(e) => setExerciseForm((f) => ({ ...f, enonce: e.target.value }))}
              placeholder="Écrire une fonction qui calcule la factorielle d'un nombre..."
              className="mt-1 w-full border border-esprit-black/15 px-3 py-2 focus:border-esprit-red outline-none transition-colors resize-none"
            />
          </div>

          {exerciseError && <p className="text-sm text-esprit-red">{exerciseError}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

          <button
            type="submit"
            disabled={creatingExercise}
            className="px-6 py-2.5 bg-esprit-red text-white font-medium cut-corner-sm hover:bg-esprit-red-dark transition-colors disabled:opacity-60"
          >
            {creatingExercise ? "Création..." : "Créer et assigner"}
          </button>
        </form>
      </div>
    </div>
  );
}
