from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional
from collections import Counter

from app.db import get_db, engine, Base
from app.models import User, Submission, Classe, Exercise
from app.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.static_analysis.analyzer import analyze_python_code
from app.static_analysis.sonar_analyzer import analyze_with_sonar, count_functions_approx
from app.rag.engine import build_vectorstore, retrieve_context
from app.llm.feedback_generator import generate_feedback, extract_note, strip_note_marker

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ESPRIT Code Evaluator API",
    description="Évaluation automatique de code étudiant, avec classes, exercices assignés et historique",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vectorstore = build_vectorstore("./data/rubrics")

SONAR_LANGUAGES = {"java", "javascript", "typescript", "html", "css", "php", "csharp"}


# ---------- Dépendance : exiger un rôle précis ----------

def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "enseignant":
        raise HTTPException(status_code=403, detail="Réservé aux enseignants.")
    return current_user


def require_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "etudiant":
        raise HTTPException(status_code=403, detail="Réservé aux étudiants.")
    return current_user


# ---------- Schémas ----------

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    nom: str
    prenom: str
    role: str = "etudiant"          # "etudiant" ou "enseignant"
    classe_id: Optional[int] = None  # requis si role="etudiant"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ClasseCreate(BaseModel):
    nom: str


class ExerciseCreate(BaseModel):
    classe_id: int
    mode: str  # "review" ou "exam"
    language: str
    titre: str
    enonce: str


class SubmissionCreate(BaseModel):
    exercise_id: int
    code: str


class EvaluationResponse(BaseModel):
    id: int
    syntax_valid: bool
    static_metrics: dict
    sonar_results: dict = {}
    relevant_criteria: str
    feedback: str
    note: Optional[int] = None


# ---------- Auth ----------

@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if data.role not in ("etudiant", "enseignant"):
        raise HTTPException(status_code=400, detail="role doit être 'etudiant' ou 'enseignant'.")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    if data.role == "etudiant":
        if not data.classe_id:
            raise HTTPException(status_code=400, detail="classe_id est requis pour un compte étudiant.")
        classe = db.query(Classe).filter(Classe.id == data.classe_id).first()
        if not classe:
            raise HTTPException(status_code=400, detail="Classe introuvable.")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        nom=data.nom,
        prenom=data.prenom,
        role=data.role,
        classe_id=data.classe_id if data.role == "etudiant" else None,
    )
    db.add(user)
    db.commit()
    return {"message": "Compte créé avec succès."}


@app.post("/auth/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "role": current_user.role,
        "classe_id": current_user.classe_id,
    }


# ---------- Classes ----------

@app.get("/classes")
def list_classes(db: Session = Depends(get_db)):
    # Public (pas d'auth) : utilisé sur la page d'inscription pour choisir sa classe.
    classes = db.query(Classe).order_by(Classe.nom).all()
    return [{"id": c.id, "nom": c.nom} for c in classes]


@app.post("/classes", status_code=status.HTTP_201_CREATED)
def create_classe(
    data: ClasseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    existing = db.query(Classe).filter(Classe.nom == data.nom).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cette classe existe déjà.")
    classe = Classe(nom=data.nom)
    db.add(classe)
    db.commit()
    db.refresh(classe)
    return {"id": classe.id, "nom": classe.nom}


# ---------- Exercices ----------

@app.post("/exercises", status_code=status.HTTP_201_CREATED)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    if data.mode not in ("review", "exam"):
        raise HTTPException(status_code=400, detail="mode doit être 'review' ou 'exam'.")

    classe = db.query(Classe).filter(Classe.id == data.classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Classe introuvable.")

    exercise = Exercise(
        teacher_id=current_user.id,
        classe_id=data.classe_id,
        mode=data.mode,
        language=data.language,
        titre=data.titre,
        enonce=data.enonce,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return {"id": exercise.id}


@app.get("/exercises/mine")
def my_exercises(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    exercises = (
        db.query(Exercise)
        .filter(Exercise.teacher_id == current_user.id)
        .order_by(Exercise.created_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "titre": e.titre,
            "mode": e.mode,
            "language": e.language,
            "classe": e.classe.nom,
            "created_at": e.created_at.isoformat(),
        }
        for e in exercises
    ]


@app.get("/exercises")
def list_exercises_for_student(
    mode: str = Query(..., pattern="^(review|exam)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    if not current_user.classe_id:
        raise HTTPException(status_code=400, detail="Aucune classe associée à ton compte.")

    exercises = (
        db.query(Exercise)
        .filter(Exercise.classe_id == current_user.classe_id, Exercise.mode == mode)
        .order_by(Exercise.created_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "titre": e.titre,
            "language": e.language,
            "enonce": e.enonce,
        }
        for e in exercises
    ]


# ---------- Évaluation ----------

@app.post("/evaluate", response_model=EvaluationResponse)
def evaluate_code(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercice introuvable.")
    if exercise.classe_id != current_user.classe_id:
        raise HTTPException(status_code=403, detail="Cet exercice n'est pas assigné à ta classe.")

    # Le mode et le langage viennent de l'exercice choisi par l'enseignant,
    # jamais du client — empêche un étudiant de forcer le mode review pour
    # éviter d'être noté sur un exercice d'examen.
    mode = exercise.mode
    language = exercise.language
    enonce = exercise.enonce
    code = submission.code

    sonar_results = {}

    if language == "python":
        metrics = analyze_python_code(code, enonce)

    elif language in SONAR_LANGUAGES:
        sonar_results = analyze_with_sonar(code, language)
        num_functions = count_functions_approx(code, language)
        metrics = {
            "syntax_valid": sonar_results.get("success", False),
            "num_functions": num_functions,
            "num_lines": len(code.split('\n')),
            "language": language,
            "sonar_bugs": sonar_results.get("bugs", 0),
            "sonar_vulnerabilities": sonar_results.get("vulnerabilities", 0),
            "sonar_code_smells": sonar_results.get("code_smells", 0)
        }

    else:
        raise HTTPException(status_code=400, detail=f"Langage non supporté : '{language}'.")

    context = retrieve_context(vectorstore, enonce=enonce, code=code, metrics=metrics)

    note = None
    if metrics.get("syntax_valid", True):
        raw_feedback = generate_feedback(
            enonce=enonce, code=code, metrics=metrics, context_rag=context
        )
        if mode == "exam":
            note = extract_note(raw_feedback)
        feedback = strip_note_marker(raw_feedback)
    else:
        feedback = f"Erreur détectée : {metrics.get('syntax_error', sonar_results.get('error', 'Vérifiez votre code.'))}"

    db_submission = Submission(
        user_id=current_user.id,
        exercise_id=exercise.id,
        mode=mode,
        enonce=enonce,
        code=code,
        language=language,
        static_metrics=metrics,
        sonar_results=sonar_results,
        feedback=feedback,
        note=note,
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    return EvaluationResponse(
        id=db_submission.id,
        syntax_valid=metrics.get("syntax_valid", False),
        static_metrics=metrics,
        sonar_results=sonar_results,
        relevant_criteria=context,
        feedback=feedback,
        note=note,
    )


# ---------- Historique ----------

@app.get("/history")
def get_history(
    mode: Optional[str] = Query(None, pattern="^(review|exam)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if mode:
        query = query.filter(Submission.mode == mode)
    submissions = query.order_by(Submission.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "mode": s.mode,
            "enonce": s.enonce,
            "code": s.code,
            "language": s.language,
            "feedback": s.feedback,
            "note": s.note,
            "created_at": s.created_at.isoformat(),
        }
        for s in submissions
    ]


@app.get("/history/{submission_id}/compare")
def compare_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = (
        db.query(Submission)
        .filter(Submission.id == submission_id, Submission.user_id == current_user.id)
        .first()
    )
    if not current:
        raise HTTPException(status_code=404, detail="Soumission introuvable.")

    previous = (
        db.query(Submission)
        .filter(
            Submission.user_id == current_user.id,
            Submission.mode == current.mode,
            Submission.created_at < current.created_at,
        )
        .order_by(Submission.created_at.desc())
        .first()
    )
    if not previous:
        raise HTTPException(status_code=404, detail="Aucune tentative précédente à comparer.")

    def extract(sub: Submission) -> dict:
        metrics = sub.static_metrics or {}
        return {
            "note": sub.note,
            "sonar_bugs": metrics.get("sonar_bugs"),
            "sonar_code_smells": metrics.get("sonar_code_smells"),
            "num_lines": metrics.get("num_lines"),
        }

    return {"current": extract(current), "previous": extract(previous)}


# ---------- Profil ----------

@app.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submissions = db.query(Submission).filter(Submission.user_id == current_user.id).all()
    exams = [s for s in submissions if s.mode == "exam" and s.note is not None]

    average_note = round(sum(s.note for s in exams) / len(exams), 1) if exams else None
    languages_breakdown = dict(Counter(s.language for s in submissions))

    return {
        "id": current_user.id,
        "email": current_user.email,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "role": current_user.role,
        "classe": current_user.classe.nom if current_user.classe else None,
        "created_at": current_user.created_at.isoformat(),
        "total_submissions": len(submissions),
        "total_exams": len(exams),
        "average_note": average_note,
        "languages_breakdown": languages_breakdown,
    }


@app.get("/")
def root():
    return {"message": "ESPRIT Code Evaluator API", "status": "OK"}


@app.get("/health")
def health():
    return {"status": "ok"}
