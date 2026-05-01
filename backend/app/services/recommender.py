"""Vector-based Thai dish recommender with MongoDB embedding cache."""
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.database.db import get_db


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    return SentenceTransformer(
        "Qwen/Qwen3-Embedding-4B",
        model_kwargs={"device_map": "auto", "attn_implementation": "sdpa"},
    )


def _load_json(filename: str) -> list[dict]:
    return json.loads((Path(settings.data_dir) / filename).read_text())


def _get_or_build_matrix() -> tuple[list[dict], np.ndarray]:
    """Return Thai dishes list and their embedding matrix, using Mongo as cache."""
    db = get_db()
    col = db["dish_embeddings"]
    dishes = _load_json("thai_dishes.json")

    cached = list(col.find({}, {"_id": 0}).sort("dish_id", 1))
    if len(cached) == len(dishes):
        matrix = np.array([doc["vector"] for doc in cached], dtype=np.float32)
        return dishes, matrix

    col.delete_many({})
    sensory_strings = [d["sensory_string"] for d in dishes]
    vectors = _model().encode(sensory_strings)
    matrix = np.array(vectors, dtype=np.float32)

    col.insert_many([
        {"dish_id": d["dish_id"], "vector": v.tolist()}
        for d, v in zip(dishes, vectors)
    ])

    return dishes, matrix


def _cosine_scores(matrix: np.ndarray, query: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(query)
    return matrix @ query / np.where(norms == 0, 1, norms)


def _fingerprint(liked_food_ids: list[str], global_foods: list[dict]) -> np.ndarray:
    liked = [f for f in global_foods if f["id"] in liked_food_ids]
    liked_vectors = _model().encode(
        [f["sensory_string"] for f in liked], prompt_name="query"
    )
    return np.mean(liked_vectors, axis=0)


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
    Once likes exist, returns the unseen card whose flavour profile is most
    dissimilar to the current fingerprint — maximising information gain.
    """
    global_foods = _load_json("global_foods.json")
    seen_set = set(seen_ids)
    unseen = [f for f in global_foods if f["id"] not in seen_set]

    if not unseen:
        return None

    if not liked_ids:
        return unseen[0]

    fp = _fingerprint(liked_ids, global_foods)

    unseen_vectors = _model().encode([f["sensory_string"] for f in unseen])
    unseen_matrix = np.array(unseen_vectors, dtype=np.float32)
    scores = _cosine_scores(unseen_matrix, fp)

    # Least similar → most new information about the user's taste range
    best_idx = int(np.argmin(scores))
    return unseen[best_idx]
