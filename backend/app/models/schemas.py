"""Pydantic request/response schemas."""
from pydantic import BaseModel


class DishOut(BaseModel):
    dish_id: str
    name: str
    thai_name: str
    english_name: str
    image_url: str
    sensory_string: str


class VendorOut(BaseModel):
    vendor_id: str
    vendor_name: str
    distance: str
    google_maps_url: str
    flashcard_thai: str
    flashcard_phonetic: str


class RecommendRequest(BaseModel):
    liked_food_ids: list[str]


class RecommendResponse(BaseModel):
    dish: DishOut
    vendor: VendorOut
    explanation: str
