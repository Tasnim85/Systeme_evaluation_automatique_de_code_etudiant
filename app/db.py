from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite en fichier local — zéro configuration, suffisant pour un projet de stage.
# Le fichier apparaîtra à la racine du projet après le premier lancement.
DATABASE_URL = "sqlite:///./esprit_evaluator.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # requis pour SQLite + FastAPI
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
