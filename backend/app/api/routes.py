"""HTTP routes."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import (
    NextCardRequest,
    RecommendRequest,
    RecommendResponse,
    RecommendResult,
    DishOut,
    VendorOut,
)
from app.services import recommender
from app.services.llm import get_match_explanation

router = APIRouter()

# Load once at startup — avoids a disk read on every /recommend request.
_global_foods: list[dict] = json.loads(
    (Path(settings.data_dir) / "global_foods.json").read_text()
)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    """Returns 200 when the embedding model is loaded and caches are built."""
    if not recommender.is_ready():
        raise HTTPException(status_code=503, detail="warming_up")
    return {"status": "ready"}


@router.get("/global-foods")
async def global_foods():
    return _global_foods


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_dish(body: RecommendRequest):
    if not body.liked_food_ids:
        raise HTTPException(status_code=400, detail="liked_food_ids cannot be empty")

    matches = recommender.recommend(
        body.liked_food_ids,
        top_k=5,
        dietary_restrictions=body.dietary_restrictions,
    )

    liked_names = [f["name"] for f in _global_foods if f["id"] in body.liked_food_ids]

    results = []
    for rank, (dish, vendor) in enumerate(matches):
        if rank == 0:
            # Properly awaited async Ollama call — runs on GPU, non-blocking
            explanation = await get_match_explanation(
                liked_names=liked_names,
                dish_name=dish["english_name"],
                fallback_keywords=dish["match_reason_keywords"].split(", "),
            )
        else:
            keywords = dish["match_reason_keywords"].split(", ")
            explanation = f"You'll love this — it's {', '.join(keywords)}."

        results.append(
            RecommendResult(
                dish=DishOut(**{k: dish[k] for k in DishOut.model_fields if k in dish}),
                vendor=VendorOut(**{k: vendor[k] for k in VendorOut.model_fields}),
                explanation=explanation,
            )
        )

    return RecommendResponse(results=results)


@router.post("/next-card")
async def next_card(body: NextCardRequest):
    card = recommender.next_card(
        body.liked_ids,
        body.seen_ids,
        dietary_restrictions=body.dietary_restrictions,
    )
    if card is None:
        raise HTTPException(status_code=404, detail="No more cards available")
    return card
