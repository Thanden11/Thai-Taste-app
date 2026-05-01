"""HTTP routes."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models.schemas import RecommendRequest, RecommendResponse, DishOut, VendorOut
from app.services import recommender
from app.services.llm import get_match_explanation

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/global-foods")
async def global_foods():
    path = Path(settings.data_dir) / "global_foods.json"
    return json.loads(path.read_text())


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_dish(body: RecommendRequest):
    if not body.liked_food_ids:
        raise HTTPException(status_code=400, detail="liked_food_ids cannot be empty")

    dish, vendor = recommender.recommend(body.liked_food_ids)

    global_foods = json.loads((Path(settings.data_dir) / "global_foods.json").read_text())
    liked_names = [
        f["name"] for f in global_foods if f["id"] in body.liked_food_ids
    ]

    explanation = get_match_explanation(
        liked_names=liked_names,
        dish_name=dish["english_name"],
        fallback_keywords=dish["match_reason_keywords"].split(", "),
    )

    return RecommendResponse(
        dish=DishOut(**{k: dish[k] for k in DishOut.model_fields}),
        vendor=VendorOut(**{k: vendor[k] for k in VendorOut.model_fields}),
        explanation=explanation,
    )
