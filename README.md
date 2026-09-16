# Système d'évaluation automatique de code étudiant — ESPRIT

Projet réalisé dans le cadre du stage de 4ème année Data Science à ESPRIT.

Système complet d'évaluation automatique de code étudiant, composé de deux parties construites successivement :

1. **Le moteur d'évaluation** (API Python) — analyse un code et un énoncé, génère un feedback pédagogique noté ou non.
2. **La plateforme complète** (Next.js + FastAPI étendu) — comptes utilisateurs, classes, exercices assignés, historique, export PDF.

---

## Partie 1 — Moteur d'évaluation

### Stack
FastAPI + analyse statique (AST Python natif + SonarQube) + RAG (LangChain/ChromaDB) + LLM (Groq).

### Architecture
```
main.py                          → orchestration du pipeline /evaluate
app/static_analysis/
  ├── analyzer.py                → AST pour Python (fonctions, classes, docstrings)
  └── sonar_analyzer.py          → Sonar générique pour tous les autres langages
app/rag/engine.py                → récupération de critères pédagogiques (ChromaDB)
app/llm/feedback_generator.py    → génération du feedback (Groq)
data/rubrics/*.md                → base de critères pour le RAG
```

### Langages supportés
- Python (AST natif)
- Java (Spring), JavaScript, TypeScript (Angular), PHP (Symfony), HTML, CSS, C# (.NET, analyse limitée) via SonarQube

---

## Partie 2 — Plateforme complète

### Modèle de données
```
users        : id, email, password_hash, nom, prénom, role (etudiant/enseignant), classe_id
classes      : id, nom
exercises    : id, teacher_id, classe_id, mode (review/exam), language, titre, enonce
submissions  : id, user_id, exercise_id, mode, enonce, code, language,
               static_metrics, sonar_results, feedback, note, created_at
```

### Backend
- `app/db.py` — connexion SQLite (fichier local, zéro config)
- `app/models.py` — modèles SQLAlchemy (User, Classe, Exercise, Submission)
- `app/auth.py` — hash de mot de passe (bcrypt/passlib) + JWT (python-jose)
- `main.py` — routes d'authentification, classes, exercices, évaluation, historique, profil

**Décision de sécurité clé** : le mode (review/exam) est déterminé côté serveur par l'exercice choisi, jamais envoyé librement par le client — empêche un étudiant de forcer le mode review pour éviter d'être noté.

**Note fiable** : le LLM termine par `NOTE_FINALE: X/20`, parsé côté backend (`extract_note()`) et stocké comme entier en base.

### Frontend (Next.js — App Router)
```
app/
├── page.tsx                          → Accueil
├── login/, signup/                   → Authentification
├── dashboard/
│   ├── review/, exam/                → Soumission de code
│   ├── history/                      → Historique + comparaison
│   ├── profile/                      → Statistiques du compte
│   └── teacher/exercises/            → Gestion classes + exercices
components/
├── SubmissionWorkspace.tsx
├── ExportPdfButton.tsx               → Export PDF (@react-pdf/renderer)
└── LoadingScreen.tsx
lib/api.ts                            → Client API centralisé (JWT)
```

### Design system
- Palette extraite du logo ESPRIT : rouge `#E2001A`, noir `#121212`, gris `#9CA3A6`, fond `#F6F5F4`, charcoal `#1E1E1E`
- Typographie : Space Grotesk (titres) + IBM Plex Sans (corps)
- Motif visuel : coins coupés en biais (clip-path)

---

## Installation

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # ou venv\Scripts\activate sous Windows
pip install -r requirements.txt
cp .env.example .env       # renseigner GROQ_API_KEY, JWT_SECRET, etc.
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Technologies principales
FastAPI · SQLAlchemy · SQLite · JWT (python-jose) · bcrypt/passlib · LangChain · ChromaDB · Groq API · SonarQube · Next.js (App Router) · Framer Motion · @react-pdf/renderer

---

## Auteur
Projet de stage — 4ème année Data Science, ESPRIT.
