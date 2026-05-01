"""App settings loaded from .env via pydantic-settings."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Always points to backend/app/data/ regardless of where uvicorn is launched from.
_DEFAULT_DATA_DIR = str(Path(__file__).parent / "data")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:8501"
    mongo_url: str = "mongodb://mongo:27017"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "gemma4:e4b"
    data_dir: str = _DEFAULT_DATA_DIR

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
