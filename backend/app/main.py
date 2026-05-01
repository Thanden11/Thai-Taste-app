"""FastAPI entrypoint."""
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Thread

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import settings
from app.services import recommender


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start model warmup in a background thread so the server accepts requests
    # immediately. The /ready endpoint returns 503 until warmup completes.
    Thread(target=recommender.warmup, daemon=True, name="warmup").start()
    yield


app = FastAPI(title="Thai Taste API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

_images_dir = f"{settings.data_dir}/images"
if Path(_images_dir).is_dir():
    app.mount("/images", StaticFiles(directory=_images_dir), name="images")
