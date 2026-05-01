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
    """Return dishes list and their embedding matrix, using Mongo as cache."""
    db = get_db()
    col = db["dish_embeddings"]
    dishes = _load_json("thai_dishes.json")

    cached = list(col.find({}, {"_id": 0}).sort("dish_id", 1))
    if len(cached) == len(dishes):
        matrix = np.array([doc["vector"] for doc in cached], dtype=np.float32)
        return dishes, matrix

    # Build and store embeddings
    col.delete_many({})
    sensory_strings = [d["sensory_string"] for d in dishes]
    vectors = _model().encode(sensory_strings)
    matrix = np.array(vectors, dtype=np.float32)

    col.insert_many([
        {"dish_id": d["dish_id"], "vector": v.tolist()}
        for d, v in zip(dishes, vectors)
    ])

    return dishes, matrix


def recommend(liked_food_ids: list[str], top_n: int = 3) -> list[tuple[dict, dict]]:
    global_foods = _load_json("global_foods.json")
    liked = [f for f in global_foods if f["id"] in liked_food_ids]

    liked_strings = [f["sensory_string"] for f in liked]
    liked_vectors = _model().encode(liked_strings, prompt_name="query")
    fingerprint = np.mean(liked_vectors, axis=0)

    dishes, matrix = _get_or_build_matrix()

    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(fingerprint)
    similarities = matrix @ fingerprint / np.where(norms == 0, 1, norms)
    top_indices = np.argsort(similarities)[::-1][:top_n]

    vendors = _load_json("vendors.json")
    results = []
    for idx in top_indices:
        dish = dishes[int(idx)]
        vendor = next(v for v in vendors if v["dish_id"] == dish["dish_id"])
        results.append((dish, vendor))

    return results
