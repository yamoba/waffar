from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

model = None


def get_model():
    global model
    if model is None:
        logger.info("Loading sentence-transformers model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded")
    return model


class MatchRequest(BaseModel):
    title: str
    brand: str | None = None
    model_name: str | None = None
    candidates: list[dict]


class MatchResult(BaseModel):
    candidateId: str
    score: float
    method: str


@router.post("/match", response_model=list[MatchResult])
def match_products(req: MatchRequest):
    if not req.candidates:
        return []

    results = []

    # Stage 1: Exact brand+model match
    if req.brand and req.model_name:
        for candidate in req.candidates:
            c_brand = (candidate.get("brand") or "").lower()
            c_model = (candidate.get("model") or "").lower()
            if c_brand == req.brand.lower() and c_model == req.model_name.lower():
                results.append(MatchResult(
                    candidateId=candidate["id"],
                    score=0.99,
                    method="exact_brand_model",
                ))

    if results:
        return sorted(results, key=lambda x: x.score, reverse=True)

    # Stage 2: Token overlap
    source_tokens = set(tokenize(req.title))
    for candidate in req.candidates:
        c_tokens = set(tokenize(candidate.get("title", "")))
        if not c_tokens:
            continue
        overlap = len(source_tokens & c_tokens)
        union = len(source_tokens | c_tokens)
        jaccard = overlap / union if union > 0 else 0
        if jaccard > 0.5:
            results.append(MatchResult(
                candidateId=candidate["id"],
                score=round(jaccard, 3),
                method="token_overlap",
            ))

    if results:
        return sorted(results, key=lambda x: x.score, reverse=True)[:5]

    # Stage 3: Semantic embedding similarity
    try:
        m = get_model()
        source_emb = m.encode([req.title])
        candidate_titles = [c.get("title", "") for c in req.candidates]
        candidate_embs = m.encode(candidate_titles)
        similarities = cosine_similarity(source_emb, candidate_embs)[0]

        for i, sim in enumerate(similarities):
            if sim > 0.6:
                results.append(MatchResult(
                    candidateId=req.candidates[i]["id"],
                    score=round(float(sim), 3),
                    method="semantic",
                ))
    except Exception as e:
        logger.error(f"Embedding match failed: {e}")

    return sorted(results, key=lambda x: x.score, reverse=True)[:5]


def tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    stopwords = {"the", "a", "an", "in", "on", "at", "for", "with", "and", "or", "من", "في", "مع", "على"}
    return [t for t in tokens if t not in stopwords and len(t) > 1]
