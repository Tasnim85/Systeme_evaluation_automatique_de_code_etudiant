import re
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_feedback(enonce: str, code: str, metrics: dict, context_rag: str) -> str:
    num_functions = metrics.get('num_functions', 0)
    if num_functions is None:
        num_functions_texte = "Non applicable (pas de notion de fonction pour ce langage)"
    else:
        num_functions_texte = str(num_functions)

    metriques_texte = f"""
- Syntaxe valide : {'Oui' if metrics.get('syntax_valid') else 'Non'}
- Nombre de fonctions : {num_functions_texte}
- Nombre de lignes : {metrics.get('num_lines', 0)}
- Fonctions sans docstring : {metrics.get('functions_without_docstrings', [])}
- Correspondance avec l'énoncé : {metrics.get('correspondance_enonce_code', 0)} mots en commun
"""
    system_prompt = """Tu es un correcteur expert en programmation, pédagogue et bienveillant.
Ton feedback doit :
1. Analyser si le code répond à l'énoncé
2. Mentionner les points forts avant les points faibles
3. Donner des suggestions concrètes avec exemples
4. Se terminer PAR UNE SEULE LIGNE finale au format exact : "NOTE_FINALE: X/20"
   (X est un entier de 0 à 20). Cette ligne doit être la toute dernière ligne
   de ta réponse, sans texte après.
Tu te bases UNIQUEMENT sur les critères pédagogiques fournis et l'énoncé donné."""

    user_prompt = f"""
## Énoncé de l'exercice
{enonce}
## Code soumis
```
{code}
```
## Analyse statique
{metriques_texte}
## Critères pédagogiques
{context_rag}
Génère un feedback complet et personnalisé basé uniquement sur cet énoncé."""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content


def extract_note(feedback: str) -> int | None:
    """
    Extrait la note finale du texte du feedback pour la stocker de façon
    fiable en base (colonne `note`, entier), plutôt que de reparser le texte
    côté frontend. Cherche d'abord le format structuré demandé au LLM
    (NOTE_FINALE: X/20), et retombe sur un pattern générique en secours.
    """
    match = re.search(r'NOTE_FINALE\s*:\s*(\d{1,2})\s*/\s*20', feedback, re.IGNORECASE)
    if match:
        return min(int(match.group(1)), 20)

    # Filet de sécurité si jamais le LLM n'a pas respecté le format exact :
    # on prend la dernière occurrence de "X/20" dans le texte.
    fallback_matches = re.findall(r'(\d{1,2})\s*/\s*20', feedback)
    if fallback_matches:
        return min(int(fallback_matches[-1]), 20)

    return None


def strip_note_marker(feedback: str) -> str:
    """
    Retire la ligne technique NOTE_FINALE: X/20 du texte affiché à l'utilisateur
    (elle est utile pour le parsing, pas pour la lecture humaine).
    """
    return re.sub(r'\n?NOTE_FINALE\s*:\s*\d{1,2}\s*/\s*20\s*$', '', feedback.strip(), flags=re.IGNORECASE).strip()
