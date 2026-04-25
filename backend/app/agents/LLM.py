from crewai import LLM
from app.core.config import settings

# Primary LLM — specialist agents (tool calling)
llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=settings.gemini_api_key,
    temperature=0.7,
)

# Router LLM — intent classification only (no tools)
router_llm = LLM(
    model="gemini/gemini-2.5-flash",
    api_key=settings.gemini_api_key,
    temperature=0,
)