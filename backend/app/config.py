from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Central app configuration. All values are overridable via .env or
    real environment variables — nothing sensitive is hardcoded here."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Hope Gate API"
    environment: str = "development"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "hope_gate"

    jwt_secret: str = "CHANGE_ME_IN_PRODUCTION"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 12  # 12 hours

    model_dir: Path = BASE_DIR / "app" / "ml" / "artifacts"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
