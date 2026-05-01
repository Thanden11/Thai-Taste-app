"""Vector-based Thai dish recommender with MongoDB embedding cache."""
import json
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.database.db import get_db

log = logging.getLogger(__name__)

# Set to True once warmup() completes successfully.
_warmed_up = False


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    log.info("Loading embedding model (this takes ~30 s on first run)…")
    model = SentenceTransformer(
        "Qwen/Qwen3-Embedding-4B",
        model_kwargs={"device_map": "auto", "attn_implementation": "sdpa"},
    )
    log.info("Embedding model loaded.")
    return model


def _load_json(filename: str) -> list[dict]:
    return json.loads((Path(settings.data_dir) / filename).read_text())


def _get_or_build_matrix() -> tuple[list[dict], np.ndarray]:
    """Thai dish embeddings — built once and cached in MongoDB."""
    db = get_db()
    col = db["dish_embeddings"]
    dishes = _load_json("thai_dishes.json")

    cached = list(col.find({}, {"_id": 0}).sort("dish_id", 1))
    if len(cached) == len(dishes):
        return dishes, np.array([doc["vector"] for doc in cached], dtype=np.float32)

    log.info("Building Thai dish embedding matrix (%d dishes)…", len(dishes))
    col.delete_many({})
    vectors = _model().encode([d["sensory_string"] for d in dishes])
    matrix = np.array(vectors, dtype=np.float32)
    col.insert_many([
        {"dish_id": d["dish_id"], "vector": v.tolist()}
        for d, v in zip(dishes, vectors)
    ])
    log.info("Thai dish embeddings cached.")
    return dishes, matrix


def _get_or_build_global_matrix() -> tuple[list[dict], np.ndarray]:
    """Global food embeddings — built once and cached in MongoDB."""
    db = get_db()
    col = db["global_food_embeddings"]
    foods = _load_json("global_foods.json")

    cached = list(col.find({}, {"_id": 0}).sort("id", 1))
    if len(cached) == len(foods):
        return foods, np.array([doc["vector"] for doc in cached], dtype=np.float32)

    log.info("Building global food embedding matrix (%d foods)…", len(foods))
    col.delete_many({})
    vectors = _model().encode([f["sensory_string"] for f in foods])
    matrix = np.array(vectors, dtype=np.float32)
    col.insert_many([
        {"id": f["id"], "vector": v.tolist()}
        for f, v in zip(foods, vectors)
    ])
    log.info("Global food embeddings cached.")
    return foods, matrix


def warmup() -> None:
    """Pre-load the model and build both embedding caches.
    Called in a background thread at startup so the first request is fast.
    """
    global _warmed_up
    log.info("Warmup started.")
    _model()
    _get_or_build_matrix()
    _get_or_build_global_matrix()
    _warmed_up = True
    log.info("Warmup complete — ready to serve.")


def is_ready() -> bool:
    return _warmed_up


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cosine_scores(matrix: np.ndarray, query: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)
    return matrix @ query / np.where(norms == 0, 1, norms)


def _fingerprint(liked_food_ids: list[str], global_foods: list[dict]) -> np.ndarray:
    liked = [f for f in global_foods if f["id"] in liked_food_ids]
    liked_vectors = _model().encode(
        [f["sensory_string"] for f in liked], prompt_name="query"
    )
    return np.mean(liked_vectors, axis=0)


# ── Public API ────────────────────────────────────────────────────────────────

def recommend(liked_food_ids: list[str], top_k: int = 5) -> list[tuple[dict, dict]]:
    """Return the top_k best-matching Thai (dish, vendor) pairs."""
    global_foods = _load_json("global_foods.json")
    fp = _fingerprint(liked_food_ids, global_foods)

    dishes, matrix = _get_or_build_matrix()
    scores = _cosine_scores(matrix, fp)
    top_indices = np.argsort(scores)[::-1][:top_k]

    vendor_map = {v["dish_id"]: v for v in _load_json("vendors.json")}
    return [(dishes[i], vendor_map[dishes[i]["dish_id"]]) for i in top_indices]


def next_card(liked_ids: list[str], seen_ids: list[str]) -> dict | None:
    """Return the most informative unseen global food card.

    With no likes yet, returns the first unseen card.
    Once likes exist, returns the card most dissimilar to the current
    flavour fingerprint — maximising information gain per swipe.
    """
    global_foods, global_matrix = _get_or_build_global_matrix()
    seen_set = set(seen_ids)

    unseen_indices = [i for i, f in enumerate(global_foods) if f["id"] not in seen_set]
    if not unseen_indices:
        return None

    if not liked_ids:
        return global_foods[unseen_indices[0]]

    fp = _fingerprint(liked_ids, global_foods)

    unseen_matrix = global_matrix[unseen_indices]
    scores = _cosine_scores(unseen_matrix, fp)
    best = unseen_indices[int(np.argmin(scores))]
    return global_foods[best]
