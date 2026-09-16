const TOKEN_KEY = "esprit_token";

// Appel DIRECT au backend, sans passer par le proxy Next.js (next.config.js).
// Le proxy de "next dev" a un timeout implicite côté Node qui coupe la
// connexion sur les requêtes longues (ex: analyse C# + Groq peut dépasser
// 60s). Le backend a déjà CORS activé pour localhost:3000, donc l'appel
// direct fonctionne sans configuration supplémentaire.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY_STORAGE = TOKEN_KEY;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY_STORAGE);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY_STORAGE, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY_STORAGE);
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expirée, reconnecte-toi.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Erreur ${res.status}`);
  }

  return res.json();
}

export interface SignupPayload {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role: "etudiant" | "enseignant";
  classe_id?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ExerciseCreatePayload {
  classe_id: number;
  mode: "review" | "exam";
  language: string;
  titre: string;
  enonce: string;
}

export const api = {
  signup: (data: SignupPayload) =>
    apiFetch("/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data: LoginPayload) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiFetch("/auth/me"),

  // Classes
  listClasses: () => apiFetch("/classes"),
  createClasse: (nom: string) =>
    apiFetch("/classes", { method: "POST", body: JSON.stringify({ nom }) }),

  // Exercices (étudiant)
  exercisesForMode: (mode: "review" | "exam") => apiFetch(`/exercises?mode=${mode}`),

  // Exercices (enseignant)
  createExercise: (data: ExerciseCreatePayload) =>
    apiFetch("/exercises", { method: "POST", body: JSON.stringify(data) }),
  myExercises: () => apiFetch("/exercises/mine"),

  // Évaluation
  evaluate: (data: { exercise_id: number; code: string }) =>
    apiFetch("/evaluate", { method: "POST", body: JSON.stringify(data) }),

  // Historique
  history: (mode?: "review" | "exam") =>
    apiFetch(`/history${mode ? `?mode=${mode}` : ""}`),
  compare: (submissionId: number) => apiFetch(`/history/${submissionId}/compare`),

  profile: () => apiFetch("/profile"),
};
