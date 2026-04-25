from crewai import LLM
from app.core.config import settings

llm = LLM(
    model="groq/llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0,
    max_tokens=700, 
)


router_llm = LLM(
    model="groq/llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0,
)
