from crewai import LLM
from app.core.config import settings

# Primary LLM — used by all specialist agents (high quality, needs tool calling)
llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=settings.groq_api_key,
    temperature=0,
)

# Router LLM — used ONLY for intent classification (no tools needed).
# gemma2-9b-it has 15,000 TPM on Groq free tier (vs 6,000 for llama models),
# which prevents rate-limit failures when multiple requests arrive per minute.
router_llm = LLM(
    model="groq/gemma2-9b-it",
    api_key=settings.groq_api_key,
    temperature=0,
)
