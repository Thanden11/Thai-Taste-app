"""Ollama-powered match explanation with safe fallback."""
import ollama

from app.config import settings


async def get_match_explanation(
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
        client = ollama.AsyncClient(host=settings.ollama_url)
        response = await client.generate(
            model=settings.ollama_model,
            prompt=prompt,
            keep_alive=-1,   # keep model pinned in GPU VRAM between calls
        )
        return response.response.strip()
    except Exception as e:
        print(f"[llm] Ollama error: {e}")
        return f"You'll love this — it's {', '.join(fallback_keywords)}."
