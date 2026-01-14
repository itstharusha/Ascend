from langchain_groq import ChatGroq
from src.config.settings import settings


def get_llm(temperature: float | None = None, max_tokens: int | None = None):
    """Central place to create LLM instance"""
    if not settings.GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Configure it in your environment or .env before running consultations."
        )
    return ChatGroq(
        model=settings.LLM_MODEL,
        temperature=temperature if temperature is not None else settings.TEMPERATURE,
        max_tokens=max_tokens if max_tokens is not None else settings.MAX_TOKENS,
        api_key=settings.GROQ_API_KEY,
    )


# Convenience exports
fast_llm = lambda: get_llm(temperature=0.4, max_tokens=1200)
thinking_llm = lambda: get_llm(temperature=0.7, max_tokens=4096)
creative_llm = lambda: get_llm(temperature=0.9, max_tokens=3000)