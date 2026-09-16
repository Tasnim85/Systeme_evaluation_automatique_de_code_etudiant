from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from dotenv import load_dotenv
import os

load_dotenv()

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

def load_rubrics(rubrics_path: str = "./data/rubrics") -> list:
    """
    Charge tous les fichiers .md du dossier rubrics
    """
    loader = DirectoryLoader(
        rubrics_path,
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"}
    )
    docs = loader.load()
    print(f"{len(docs)} fichier(s) de rubriques chargé(s) depuis {rubrics_path}")
    return docs

def build_vectorstore(rubrics_path: str = "./data/rubrics") -> Chroma:
    """
    Charge les rubriques depuis le dossier,
    les découpe et les stocke dans ChromaDB
    """
    # Charger les fichiers
    docs = load_rubrics(rubrics_path)

    # Découper en morceaux
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,
        chunk_overlap=20
    )
    chunks = splitter.split_documents(docs)
    print(f"{len(chunks)} morceaux créés")

    # Stocker dans ChromaDB
    vectorstore = Chroma.from_documents(chunks, embeddings)
    return vectorstore

def retrieve_context(vectorstore, enonce: str, code: str, metrics: dict, k: int = 3) -> str:
    """
    Cherche les critères les plus pertinents
    selon l'énoncé et les problèmes détectés
    """
    problemes = []
    if metrics.get("functions_without_docstrings"):
        problemes.append("fonctions sans documentation")
    if not metrics.get("syntax_valid"):
        problemes.append("erreur de syntaxe")
    if metrics.get("num_functions", 0) == 0:
        problemes.append("aucune fonction définie")

    query = f"""
    Exercice demandé : {enonce[:200]}
    Problèmes détectés : {', '.join(problemes) if problemes else 'aucun problème majeur'}
    Évaluer la qualité du code soumis.
    """

    results = vectorstore.similarity_search(query.strip(), k=k)
    context = "\n\n".join([r.page_content for r in results])
    return context