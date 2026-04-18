from crewai import LLM
from app.core.config import settings

llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
)