from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base


class Classe(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True, nullable=False)  # ex: "4DS9"
    created_at = Column(DateTime, default=datetime.utcnow)

    etudiants = relationship("User", back_populates="classe")
    exercises = relationship("Exercise", back_populates="classe")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    role = Column(String, nullable=False, default="etudiant")  # "etudiant" ou "enseignant"
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=True)  # requis si étudiant
    created_at = Column(DateTime, default=datetime.utcnow)

    classe = relationship("Classe", back_populates="etudiants")
    submissions = relationship("Submission", back_populates="user")
    exercises_created = relationship("Exercise", back_populates="teacher")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    mode = Column(String, nullable=False)  # "review" ou "exam" — fixé par l'enseignant
    language = Column(String, nullable=False)
    titre = Column(String, nullable=False)
    enonce = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", back_populates="exercises_created")
    classe = relationship("Classe", back_populates="exercises")
    submissions = relationship("Submission", back_populates="exercise")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    mode = Column(String, nullable=False)  # copié depuis l'exercice au moment de la soumission
    enonce = Column(Text, nullable=False)  # copié depuis l'exercice (historique fiable même si l'exercice change plus tard)
    code = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    static_metrics = Column(JSON, default={})
    sonar_results = Column(JSON, default={})
    feedback = Column(Text, nullable=False)
    note = Column(Integer, nullable=True)  # null si mode="review"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="submissions")
    exercise = relationship("Exercise", back_populates="submissions")
