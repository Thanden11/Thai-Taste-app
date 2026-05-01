"""Ollama-powered match explanation with safe fallback."""
import ollama

from app.config import settings


def get_match_explanation(
    liked_names: list[str],
    dish_name: str,
    fallback_keywords: list[str],
) -> str:
    prompt = (
        f"We matched you with {dish_name} because you loved "
        f"{', '.join(liked_names)}. "
        "In 2 sentences, explain why these flavors connect. "
        "Be warm, specific, and avoid mentioning country names."
    )
    try:
        client = ollama.Client(host=settings.ollama_url)
        response = client.generate(model=settings.ollama_model, prompt=prompt)
        return response.response.strip()
    except Exception:
        return f"You'll love this — it's {', '.join(fallback_keywords)}."
