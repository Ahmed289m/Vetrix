from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Vetrix"
    app_env: str = "development"
    app_debug: bool = True

    mongodb_uri: str = "mongodb://admin:admin123@localhost:27017"
    mongodb_db_name: str = "vetrix"

    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 10080

    model_config = SettingsConfigDict(
        # Resolve env file reliably regardless of current working directory (WSL vs Windows).
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
