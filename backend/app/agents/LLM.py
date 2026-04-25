from crewai import LLM
from app.core.config import settings

# Primary LLM — used by all specialist agents (high quality, needs tool calling)
llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0,
)

# Router LLM — lightweight, fast model for intent classification only.
# llama-3.1-8b-instant has a much higher Groq rate limit and is ideal
# for the simple one-word classification the RouterAgent performs.
router_llm = LLM(
    model="groq/llama-3.1-8b-instant",
    api_key=settings.groq_api_key,
    temperature=0,
)