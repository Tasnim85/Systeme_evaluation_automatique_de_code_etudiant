import ast
import re

def analyze_python_code(code: str, enonce: str = "") -> dict:
    results = {}
    results["enonce_fourni"] = len(enonce.strip()) > 0

    # 1. Vérifier la syntaxe
    try:
        tree = ast.parse(code)
        results["syntax_valid"] = True
    except SyntaxError as e:
        return {
            "syntax_valid": False,
            "syntax_error": str(e),
            "enonce_fourni": results["enonce_fourni"]
        }

    # 2. Éléments de base
    functions = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    classes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]

    results["num_functions"] = len(functions)
    results["num_classes"] = len(classes)
    results["num_lines"] = len(code.strip().split('\n'))

    # 3. Fonctions sans docstrings
    results["functions_without_docstrings"] = [
        f.name for f in functions if not ast.get_docstring(f)
    ]

    # 4. Vérification basique énoncé vs code
    if enonce:
        # Extraire les mots-clés de l'énoncé
        mots_enonce = set(re.findall(r'\b\w{4,}\b', enonce.lower()))
        mots_code = set(re.findall(r'\b\w{4,}\b', code.lower()))
        correspondance = mots_enonce & mots_code
        results["correspondance_enonce_code"] = len(correspondance)
        results["mots_communs"] = list(correspondance)[:10]

    return results