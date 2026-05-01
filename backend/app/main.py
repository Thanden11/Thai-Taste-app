"""FastAPI entrypoint."""
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

app.mount(
    "/images",
    StaticFiles(directory=f"{settings.data_dir}/images"),
    name="images",
)
