from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Optional so the API can boot without LLM configured.
    # We validate at call-time in get_llm().
    GROQ_API_KEY: Optional[str] = None
    LLM_MODEL: str = "llama-3.1-70b-versatile"
    TEMPERATURE: float = 0.65
    MAX_TOKENS: int = 4096


settings = Settings()