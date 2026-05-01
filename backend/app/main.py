"""FastAPI entrypoint."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import settings

app = FastAPI(title="Thai Taste API")

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
