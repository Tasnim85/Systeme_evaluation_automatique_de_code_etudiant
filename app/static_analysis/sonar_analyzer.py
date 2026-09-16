import subprocess
import requests
import os
import re
import time
import tempfile
from dotenv import load_dotenv

load_dotenv()

SONAR_URL = os.getenv("SONAR_URL", "http://localhost:9000")
SONAR_TOKEN = os.getenv("SONAR_TOKEN", "")
SONAR_PROJECT_KEY = os.getenv("SONAR_PROJECT_KEY", "code-evaluator")

SONAR_SCANNER_PATH = r"C:\sonar-scanner\bin\sonar-scanner.bat"

# Patterns approximatifs de détection de fonctions/méthodes par langage.
# Ce n'est PAS une analyse AST (contrairement à Python) : c'est une estimation
# par regex, suffisante pour donner une info correcte au LLM plutôt qu'un 0 en dur.
FUNCTION_PATTERNS = {
    "javascript": [
        r'function\s+\w+\s*\(',                 # function nomFonction(...)
        r'\w+\s*=\s*function\s*\(',              # x = function(...)
        r'\w+\s*=\s*\([^)]*\)\s*=>',             # x = (...) =>
        r'\basync\s+function\s+\w+\s*\(',        # async function nomFonction(...)
    ],
    "typescript": [
        r'function\s+\w+\s*\(',
        r'\w+\s*=\s*\([^)]*\)\s*=>',
    ],
    "php": [
        r'function\s+\w+\s*\(',
    ],
    "java": [
        r'\b(public|private|protected)\s+(static\s+)?[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*{',
    ],
    "csharp": [
        r'\b(public|private|protected|internal)\s+(static\s+)?[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*{',
    ],
    # HTML/CSS n'ont pas de notion de "fonction" ; on ne les inclut pas ici.
}

# Mapping langage (tel qu'envoyé par le front / la requête) -> extension de fichier
# Sonar détecte le langage automatiquement à partir de l'extension.
LANGUAGE_EXTENSIONS = {
    "java": "java",        # couvre aussi le code Spring
    "javascript": "js",
    "typescript": "ts",    # couvre aussi le code Angular
    "html": "html",
    "css": "css",
    "php": "php",          # couvre aussi le code Symfony
    "csharp": "cs",        # voir note ci-dessous
}

# Clés de langage réelles pour SonarQube (propriété sonar.language),
# à forcer explicitement pour éviter toute confusion de détection
# entre deux scans successifs sur le même projectKey.
SONAR_LANGUAGE_KEYS = {
    "java": "java",
    "javascript": "js",
    "typescript": "ts",
    "html": "web",
    "css": "css",
    "php": "php",
    "csharp": "cs",
}

# Langages qui nécessitent un scanner spécifique différent du sonar-scanner générique.
# C#/.NET a besoin de dotnet-sonarscanner (qui s'intègre à MSBuild) pour une analyse
# sémantique complète. Le sonar-scanner CLI classique peut quand même tourner dessus
# mais avec une analyse plus limitée (pas de résolution de types/dépendances).
LANGUAGES_NEEDING_SPECIAL_SCANNER = {"csharp"}


def analyze_with_sonar(code: str, language: str, filename: str = None) -> dict:
    """
    Analyse générique via SonarQube pour tout langage supporté
    (autre que Python, qui a son propre analyseur AST).
    """
    ext = LANGUAGE_EXTENSIONS.get(language)
    if not ext:
        return {
            "success": False,
            "error": f"Langage non supporté par l'analyse Sonar : '{language}'",
            "issues": []
        }

    if filename is None:
        filename = f"Solution.{ext}"

    if language in LANGUAGES_NEEDING_SPECIAL_SCANNER:
        # On prévient plutôt que de faire une analyse silencieusement dégradée.
        # Pour une vraie analyse C#/.NET, il faut dotnet-sonarscanner + un projet
        # buildable (.csproj/.sln), pas juste un fichier .cs isolé.
        print(f"[ATTENTION] Analyse {language} via sonar-scanner générique : "
              f"résultats limités (pas de résolution sémantique complète). "
              f"Pour une analyse complète, utiliser dotnet-sonarscanner.")

    with tempfile.TemporaryDirectory() as tmpdir:
        code_file = os.path.join(tmpdir, filename)
        with open(code_file, 'w', encoding='utf-8') as f:
            f.write(code)

        sonar_lang_key = SONAR_LANGUAGE_KEYS.get(language, "")
        # ProjectKey distincte par langage : évite que les issues d'un ancien
        # scan (autre langage) restent visibles via /api/issues/search.
        project_key = f"{SONAR_PROJECT_KEY}-{language}"

        props_file = os.path.join(tmpdir, "sonar-project.properties")
        with open(props_file, 'w') as f:
            f.write(f"""
sonar.projectKey={project_key}
sonar.sources=.
sonar.host.url={SONAR_URL}
sonar.token={SONAR_TOKEN}
sonar.language={sonar_lang_key}
""")

        try:
            result = subprocess.run(
                SONAR_SCANNER_PATH,
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=120,
                shell=True
            )

            print(f"Return code : {result.returncode}")
            print(f"Stdout : {result.stdout[:300]}")
            print(f"Stderr : {result.stderr[:300]}")
            scan_success = result.returncode == 0
        except Exception as e:
            return {
                "success": False,
                "error": f"sonar-scanner non trouvé ou a échoué : {str(e)}",
                "issues": []
            }

        if not scan_success:
            return {
                "success": False,
                "error": result.stderr[:500],
                "issues": []
            }

        # SonarQube traite l'analyse de façon ASYNCHRONE : le scanner soumet
        # le rapport et rend la main tout de suite, mais le calcul réel des
        # issues (Compute Engine) prend quelques secondes de plus côté serveur.
        # Sans attendre, get_sonar_issues() risque de récupérer un résultat
        # vide ou périmé (celui du scan précédent). On lit le report-task.txt
        # généré par le scanner pour connaître l'ID de la tâche, puis on
        # attend qu'elle soit bien "SUCCESS" avant de lire les issues.
        report_task_path = os.path.join(tmpdir, ".scannerwork", "report-task.txt")
        wait_for_ce_task(report_task_path)

    return get_sonar_issues(project_key)


def wait_for_ce_task(report_task_path: str, timeout: int = 30) -> None:
    """
    Attend que le Compute Engine de SonarQube ait fini de traiter le rapport
    d'analyse, en interrogeant l'API de statut de tâche jusqu'à SUCCESS/FAILED
    ou jusqu'au timeout.
    """
    if not os.path.exists(report_task_path):
        print("[ATTENTION] report-task.txt introuvable, impossible de vérifier "
              "que l'analyse est terminée. Résultats potentiellement périmés.")
        return

    task_id = None
    with open(report_task_path, 'r') as f:
        for line in f:
            if line.startswith("ceTaskId="):
                task_id = line.strip().split("=", 1)[1]
                break

    if not task_id:
        print("[ATTENTION] ceTaskId introuvable dans report-task.txt.")
        return

    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = requests.get(
                f"{SONAR_URL}/api/ce/task",
                params={"id": task_id},
                auth=(SONAR_TOKEN, ""),
                timeout=10
            )
            status = resp.json().get("task", {}).get("status")
            if status == "SUCCESS":
                return
            if status == "FAILED":
                print(f"[ATTENTION] La tâche d'analyse Sonar {task_id} a échoué.")
                return
        except Exception as e:
            print(f"[ATTENTION] Erreur en vérifiant le statut de la tâche Sonar : {e}")
            return
        time.sleep(1)

    print(f"[ATTENTION] Timeout en attendant la fin de l'analyse Sonar (tâche {task_id}).")


# Alias conservé pour compatibilité avec le code existant (main.py, etc.)
def analyze_java_code(java_code: str, filename: str = "Solution.java") -> dict:
    return analyze_with_sonar(java_code, "java", filename)


def get_sonar_issues(project_key: str = None) -> dict:
    """
    Récupère les issues détectées par SonarQube via son API REST.
    Utilise componentKeys (plus fiable que projectKeys sur les versions
    récentes de SonarQube pour filtrer par projet).
    """
    if project_key is None:
        project_key = SONAR_PROJECT_KEY
    try:
        response = requests.get(
            f"{SONAR_URL}/api/issues/search",
            params={
                "componentKeys": project_key,
                "resolved": "false"
            },
            auth=(SONAR_TOKEN, ""),
            timeout=10
        )

        if response.status_code != 200:
            return {"success": False, "error": "API SonarQube inaccessible", "issues": []}

        data = response.json()
        issues = []

        # Filtre défensif supplémentaire : au cas où l'API renverrait des
        # issues d'autres projets, on ne garde que celles dont le composant
        # correspond bien au project_key demandé.
        for issue in data.get("issues", []):
            component = issue.get("component", "")
            if project_key not in component:
                continue
            issues.append({
                "type": issue.get("type"),
                "severity": issue.get("severity"),
                "message": issue.get("message"),
                "line": issue.get("line"),
                "rule": issue.get("rule")
            })

        return {
            "success": True,
            "total_issues": len(issues),
            "bugs": len([i for i in issues if i["type"] == "BUG"]),
            "vulnerabilities": len([i for i in issues if i["type"] == "VULNERABILITY"]),
            "code_smells": len([i for i in issues if i["type"] == "CODE_SMELL"]),
            "issues": issues[:10]
        }

    except Exception as e:
        return {"success": False, "error": str(e), "issues": []}


def count_functions_approx(code: str, language: str) -> int:
    """
    Compte approximatif du nombre de fonctions/méthodes par regex.
    Ce n'est pas aussi fiable qu'un AST (comme pour Python), mais évite
    de renvoyer un 0 en dur trompeur pour le LLM et les métriques.
    Retourne None pour les langages sans notion de "fonction" (HTML, CSS).
    """
    patterns = FUNCTION_PATTERNS.get(language)
    if not patterns:
        return None

    count = 0
    matched_spans = set()
    for pattern in patterns:
        for match in re.finditer(pattern, code):
            # Évite de compter deux fois la même fonction si plusieurs
            # patterns matchent au même endroit (ex: TypeScript).
            span = match.start()
            if span not in matched_spans:
                matched_spans.add(span)
                count += 1

    return count