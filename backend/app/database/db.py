"""MongoDB client singleton."""
from functools import lru_cache

from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings


@lru_cache(maxsize=1)
def get_db() -> Database:
    client = MongoClient(settings.mongo_url)
    return client["thai_taste"]
