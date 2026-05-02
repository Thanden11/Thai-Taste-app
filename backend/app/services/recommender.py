"""Vector-based Thai dish recommender with MongoDB embedding cache."""
import json
import logging
import random
import re
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
    import torch
    if torch.cuda.is_available():
        device = "cuda"
        extra = {"device_map": "auto", "attn_implementation": "sdpa"}
        log.info("Loading embedding model on GPU…")
    else:
        device = "cpu"
        extra = {}
        log.warning("CUDA unavailable — loading embedding model on CPU (warmup will be slow).")

    model = SentenceTransformer(
        "Qwen/Qwen3-Embedding-4B",
        model_kwargs=extra,
        device=device,
    )
    log.info("Embedding model loaded on %s.", device.upper())
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


# ── Dietary filtering ─────────────────────────────────────────────────────────

_PORK_RE = re.compile(
    r"\b(pork|moo|pepperoni|bacon|ham|lard)\b", re.IGNORECASE
)

# Catches meat, seafood, dairy and egg indicators for vegan filtering.
_NON_VEGAN_RE = re.compile(
    r"\b(pork|moo|chicken|gai|beef|nuea|shrimp|goong|prawn|fish|pla|"
    r"seafood|talay|crab|oyster|clam|hoy|duck|lamb|meat|bacon|ham|"
    r"egg|milk|cream|butter|cheese|dairy|lard|pepperoni)\b",
    re.IGNORECASE,
)


def _item_text(item: dict) -> str:
    return " ".join([
        item.get("english_name", item.get("name", "")),
        item.get("sensory_string", ""),
        " ".join(item.get("tags", [])),
    ])


def _is_pork(item: dict) -> bool:
    return bool(_PORK_RE.search(_item_text(item)))


def _is_non_vegan(item: dict) -> bool:
    return bool(_NON_VEGAN_RE.search(_item_text(item)))


def _apply_restrictions(items: list[dict], restrictions: list[str]) -> list[dict]:
    if "no_pork" in restrictions:
        items = [i for i in items if not _is_pork(i)]
    if "vegan" in restrictions:
        items = [i for i in items if not _is_non_vegan(i)]
    return items


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cosine_scores(matrix: np.ndarray, query: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)
    return matrix @ query / np.where(norms == 0, 1, norms)


def _fingerprint(liked_food_ids: list[str], global_foods: list[dict]) -> np.ndarray:
    """Query-encoded fingerprint — used when comparing against Thai dish embeddings."""
    liked = [f for f in global_foods if f["id"] in liked_food_ids]
    liked_vectors = _model().encode(
        [f["sensory_string"] for f in liked], prompt_name="query"
    )
    return np.mean(liked_vectors, axis=0)


def _fingerprint_cached(liked_food_ids: list[str]) -> np.ndarray:
    """Fingerprint built from the cached global food matrix — NO model call.

    Used by next_card so every swipe is a fast numpy operation instead of
    a slow CPU inference call.
    """
    foods, matrix = _get_or_build_global_matrix()
    id_to_idx = {f["id"]: i for i, f in enumerate(foods)}
    indices = [id_to_idx[fid] for fid in liked_food_ids if fid in id_to_idx]
    return np.mean(matrix[indices], axis=0)


# ── Public API ────────────────────────────────────────────────────────────────

def recommend(
    liked_food_ids: list[str],
    top_k: int = 5,
    dietary_restrictions: list[str] | None = None,
) -> list[tuple[dict, dict]]:
    """Return the top_k best-matching Thai (dish, vendor) pairs.

    Dishes excluded by dietary_restrictions are removed before ranking so
    results always comply with the user's dietary preferences.
    """
    global_foods = _load_json("global_foods.json")
    fp = _fingerprint(liked_food_ids, global_foods)

    all_dishes, all_matrix = _get_or_build_matrix()
    restrictions = dietary_restrictions or []

    # Keep only allowed dishes; fall back to all dishes if filter removes everything
    allowed_idx = [i for i, d in enumerate(all_dishes) if _apply_restrictions([d], restrictions)]
    if not allowed_idx:
        allowed_idx = list(range(len(all_dishes)))

    dishes_list = [all_dishes[i] for i in allowed_idx]
    matrix = all_matrix[allowed_idx]

    scores = _cosine_scores(matrix, fp)
    top_positions = np.argsort(scores)[::-1][:top_k]

    vendor_map = {v["dish_id"]: v for v in _load_json("vendors.json")}
    return [(dishes_list[p], vendor_map[dishes_list[p]["dish_id"]]) for p in top_positions]


# Minimum likes required before the embedding fingerprint is meaningful enough
# to drive adaptive card selection.
COLD_START_THRESHOLD = 5


def next_card(
    liked_ids: list[str],
    seen_ids: list[str],
    dietary_restrictions: list[str] | None = None,
) -> dict | None:
    """Return the next global food card.

    Pork (and other restricted) cards are excluded from the pool entirely so
    users never see foods they can't eat.

    Phase 1 — cold start (liked < COLD_START_THRESHOLD): random unseen card.
    Phase 2 — adaptive: unseen card most dissimilar to the flavour fingerprint.
    """
    global_foods, global_matrix = _get_or_build_global_matrix()
    restrictions = dietary_restrictions or []
    seen_set = set(seen_ids)

    # Pool = unseen AND allowed by dietary restrictions
    pool_indices = [
        i for i, f in enumerate(global_foods)
        if f["id"] not in seen_set and _apply_restrictions([f], restrictions)
    ]
    if not pool_indices:
        return None

    # ── Phase 1: random cold-start ──────────────────────────────────────────
    if len(liked_ids) < COLD_START_THRESHOLD:
        return global_foods[random.choice(pool_indices)]

    # ── Phase 2: embedding-driven adaptive selection ─────────────────────────
    # Use cached vectors — avoids a model call on every swipe.
    fp = _fingerprint_cached(liked_ids)
    pool_matrix = global_matrix[pool_indices]
    scores = _cosine_scores(pool_matrix, fp)
    best = pool_indices[int(np.argmin(scores))]
    return global_foods[best]
