"""HTTP client wrapper for the backend API."""
import os

import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def fetch_next_card(liked_ids: list[str], seen_ids: list[str]) -> dict | None:
    """Return the next adaptive card, or None when all 20 have been seen."""
    with httpx.Client() as client:
        r = client.post(
            f"{BACKEND_URL}/next-card",
            json={"liked_ids": liked_ids, "seen_ids": seen_ids},
            timeout=60,
        )
        if r.status_code == 404:
            return None
        r.raise_for_status()
        return r.json()


def get_recommendation(liked_food_ids: list[str]) -> list[dict]:
    """Return the top-5 RecommendResult dicts."""
    with httpx.Client() as client:
        r = client.post(
            f"{BACKEND_URL}/recommend",
            json={"liked_food_ids": liked_food_ids},
            timeout=120,
        )
        r.raise_for_status()
        return r.json()["results"]


def dish_image_url(path: str) -> str:
    """Prefix a relative /images/... path with the backend base URL."""
    return f"{BACKEND_URL}{path}"
