from crewai import LLM
from app.core.config import settings

# Primary LLM — specialist agents (tool calling)
# gemini-2.0-flash: stable function calling support via LiteLLM + CrewAI
llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0.7,
)

# Router LLM — intent classification only (no tools needed)
router_llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0,
)
