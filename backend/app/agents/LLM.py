from crewai import LLM
from app.core.config import settings

# Primary LLM — specialist agents (tool calling)
# gemini-2.0-flash: stable function calling support via LiteLLM + CrewAI
llm = LLM(
    model="gemini/gemini-2.0-flash",
    api_key=settings.gemini_api_key,
    temperature=0.7,
)

# Router LLM — intent classification only (no tools needed)
router_llm = LLM(
    model="gemini/gemini-2.0-flash",
    api_key=settings.gemini_api_key,
    temperature=0,
)
