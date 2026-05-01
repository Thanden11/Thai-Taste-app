"""HTTP client wrapper for the backend API."""
import os

import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


def get_global_foods() -> list[dict]:
    with httpx.Client() as client:
        r = client.get(f"{BACKEND_URL}/global-foods", timeout=30)
        r.raise_for_status()
        return r.json()


def get_recommendation(liked_food_ids: list[str]) -> dict:
    with httpx.Client() as client:
        r = client.post(
            f"{BACKEND_URL}/recommend",
            json={"liked_food_ids": liked_food_ids},
            timeout=120,
        )
        r.raise_for_status()
        return r.json()


def dish_image_url(path: str) -> str:
    """Prefix a relative /images/... path with the backend base URL."""
    return f"{BACKEND_URL}{path}"
