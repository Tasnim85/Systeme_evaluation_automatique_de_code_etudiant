# test_rag.py
from app.rag.engine import build_vectorstore, retrieve_context

rubric = [
    "Critères d'évaluation du code Python : "
    "Lisibilité : nommage des variables clair et explicite. "
    "Modularité : fonctions courtes de moins de 20 lignes. "
    "Gestion des erreurs : utilisation de try/except appropriée. "
    "Documentation : docstrings présentes sur chaque fonction."
]

print("Construction de la base vectorielle...")
vs = build_vectorstore(rubric)
print("Base construite avec succès !")

print("\nRecherche en cours...")
context = retrieve_context(vs, "comment évaluer les fonctions ?")
print("\nRésultat :")
print(context)